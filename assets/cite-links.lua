-- Turn numbered citations in body text, e.g. [2], [18, 19], [9–11], into links
-- to the matching entry on the Sources page (appendix/sources.qmd, anchors #ref-N).
-- Citations may wrap across a line break; text outside citations is left untouched.

local MAXREF = 0
local OFFSET = "."

local function count_refs()
  local dir = quarto.project.directory or "."
  local f = io.open(dir .. "/appendix/sources.qmd", "r")
  if not f then return 0 end
  local n = 0
  for id in f:read("a"):gmatch("{#ref%-(%d+)}") do
    n = math.max(n, tonumber(id))
  end
  f:close()
  return n
end

-- Text pieces back to inlines: spaces -> Space, "\n" -> SoftBreak
local function text_inlines(s, out)
  local i = 1
  while i <= #s do
    local c = s:sub(i, i)
    if c == " " then
      out:insert(pandoc.Space()); i = i + 1
    elseif c == "\n" then
      out:insert(pandoc.SoftBreak()); i = i + 1
    else
      local j = i
      while j <= #s and s:sub(j, j) ~= " " and s:sub(j, j) ~= "\n" do j = j + 1 end
      out:insert(pandoc.Str(s:sub(i, j - 1))); i = j
    end
  end
end

-- Inside the brackets: only digits, commas, spaces/line breaks and dashes
local function valid_body(body)
  local stripped = body:gsub("–", "-"):gsub("—", "-")
  if not stripped:match("^[%d%s,%-]+$") or not stripped:match("^%d") then return false end
  for num in stripped:gmatch("%d+") do
    local n = tonumber(num)
    if n < 1 or n > MAXREF then return false end
  end
  return true
end

local function cite_inlines(body, out)
  out:insert(pandoc.Str("["))
  local i = 1
  while i <= #body do
    local s, e = body:find("%d+", i)
    if not s then text_inlines(body:sub(i), out); break end
    if s > i then text_inlines((body:sub(i, s - 1):gsub("\n", " ")), out) end
    local num = body:sub(s, e)
    out:insert(pandoc.Link(num, OFFSET .. "/appendix/sources.html#ref-" .. num, "", {class = "cite"}))
    i = e + 1
  end
  out:insert(pandoc.Str("]"))
end

-- Rewrite one run of Str/Space/SoftBreak; returns nil when it has no citation
local function rewrite(text)
  local out, pos, found = pandoc.Inlines{}, 1, false
  while true do
    local s, e, body = text:find("%[([^%[%]]-)%]", pos)
    if not s then break end
    if valid_body(body) then
      if s > pos then text_inlines(text:sub(pos, s - 1), out) end
      cite_inlines(body, out)
      found = true
      pos = e + 1
    else
      if e >= pos then text_inlines(text:sub(pos, e), out) end
      pos = e + 1
    end
  end
  if not found then return nil end
  if pos <= #text then text_inlines(text:sub(pos), out) end
  return out
end

local function flush(run, result)
  if #run == 0 then return end
  local parts = {}
  for _, el in ipairs(run) do
    if el.t == "Str" then parts[#parts + 1] = el.text
    elseif el.t == "Space" then parts[#parts + 1] = " "
    else parts[#parts + 1] = "\n" end
  end
  local new = rewrite(table.concat(parts))
  if new then result:extend(new) else result:extend(run) end
end

local function process(inlines)
  local result, run = pandoc.Inlines{}, {}
  for _, el in ipairs(inlines) do
    if el.t == "Str" or el.t == "Space" or el.t == "SoftBreak" then
      run[#run + 1] = el
    else
      flush(run, result); run = {}
      result:insert(el)
    end
  end
  flush(run, result)
  return result
end

return {
  {
    Pandoc = function(doc)
      local input = quarto.doc.input_file or ""
      if input:match("appendix/sources%.qmd$") then return doc end
      MAXREF = count_refs()
      if MAXREF == 0 then return doc end
      OFFSET = quarto.project.offset or "."
      -- Walk every inline list except the contents of existing links
      return doc:walk({
        traverse = "topdown",
        Link = function(el) return el, false end,
        Inlines = function(inlines) return process(inlines) end,
      })
    end
  }
}
