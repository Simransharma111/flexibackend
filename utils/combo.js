const normalizeText = (value) => String(value ?? "").trim();

const duplicateKey = (value) => normalizeText(value).toLocaleLowerCase();

const normalizeNames = (value) => {
  if (Array.isArray(value)) return value.flatMap(normalizeNames);
  if (value && typeof value === "object") return normalizeNames(value.name ?? "");

  const text = normalizeText(value);
  if (!text) return [];

  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      return normalizeNames(JSON.parse(text));
    } catch {
      const names = [...text.matchAll(/name\s*:\s*['"]([^'"]+)['"]/g)].map((match) => match[1].trim()).filter(Boolean);
      return names.length ? names : [text];
    }
  }

  return [text];
};

export const normalizeComboConfig = (config) => {
  const source = config && typeof config === "object" ? config : {};
  const includedItems = normalizeNames(source.includedItems);
  const selectionGroups = Array.isArray(source.selectionGroups)
    ? source.selectionGroups.map((group) => ({
        name: normalizeText(group?.name),
        minSelections: Number(group?.minSelections ?? 0),
        maxSelections: Number(group?.maxSelections ?? 0),
        items: normalizeNames(group?.items),
      }))
    : [];

  return { includedItems, selectionGroups };
};

export const validateComboConfig = (config) => {
  const normalized = normalizeComboConfig(config);
  const includedNames = new Set();
  for (const item of normalized.includedItems) {
    const key = duplicateKey(item);
    if (includedNames.has(key)) throw new Error("Included item names must be unique.");
    includedNames.add(key);
  }

  const groupNames = new Set();
  normalized.selectionGroups.forEach((group) => {
    if (!group.name) throw new Error("Selection group name is required.");
    const groupKey = duplicateKey(group.name);
    if (groupNames.has(groupKey)) throw new Error("Selection group names must be unique.");
    groupNames.add(groupKey);
    if (!Number.isInteger(group.minSelections) || !Number.isInteger(group.maxSelections) || group.minSelections < 0 || group.minSelections > group.maxSelections) {
      throw new Error("Selection group minimum and maximum must be valid.");
    }
    if (group.maxSelections > group.items.length) {
      throw new Error("Selection group maximum cannot exceed its option count.");
    }
    const optionNames = new Set();
    group.items.forEach((item) => {
      if (!item) throw new Error("Selection option name is required.");
      const key = duplicateKey(item);
      if (optionNames.has(key)) throw new Error("Selection option names must be unique within a group.");
      optionNames.add(key);
    });
  });

  return normalized;
};

export const validateComboSelections = (config, selections) => {
  const normalizedConfig = validateComboConfig(config);
  if (!Array.isArray(selections)) throw new Error("Combo selections must be an array.");
  const groups = new Map(normalizedConfig.selectionGroups.map((group) => [duplicateKey(group.name), group]));
  const seenGroups = new Set();
  const normalizedSelections = [];

  for (const selection of selections) {
    const groupName = normalizeText(selection?.groupName);
    const group = groups.get(duplicateKey(groupName));
    if (!group || seenGroups.has(duplicateKey(groupName))) throw new Error("Invalid combo selection group.");
    seenGroups.add(duplicateKey(groupName));
    const values = Array.isArray(selection?.items) ? selection.items.map(normalizeText) : [];
    const allowed = new Map(group.items.map((item) => [duplicateKey(item), item]));
    const unique = new Set();
    const items = values.map((value) => {
      const key = duplicateKey(value);
      if (!value || unique.has(key) || !allowed.has(key)) throw new Error("Invalid combo selection.");
      unique.add(key);
      return allowed.get(key);
    });
    if (items.length < group.minSelections || items.length > group.maxSelections) {
      throw new Error(`Selection group \"${group.name}\" has an invalid selection count.`);
    }
    normalizedSelections.push({ groupName: group.name, items });
  }

  for (const group of normalizedConfig.selectionGroups) {
    if (!seenGroups.has(duplicateKey(group.name)) && group.minSelections > 0) {
      throw new Error(`Selection group \"${group.name}\" is required.`);
    }
  }
  return normalizedSelections;
};
