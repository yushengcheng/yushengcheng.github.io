(() => {
  "use strict";

  const EMPTY_VALUE = "/";

  function normalizeCell(value) {
    return String(value ?? "").replace(/\r/g, "").trim();
  }

  function hasValue(value) {
    const normalized = normalizeCell(value);
    return normalized !== "" && normalized !== EMPTY_VALUE;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function safeHref(value) {
    const href = normalizeCell(value);
    try {
      const url = new URL(href, document.baseURI);
      return url.protocol === "http:" || url.protocol === "https:" ? url.href : "#";
    } catch {
      return "#";
    }
  }

  function parseCSV(text) {
    const source = String(text).replace(/^\uFEFF/, "");
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let index = 0; index < source.length; index += 1) {
      const character = source[index];

      if (character === '"') {
        if (inQuotes && source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }
        continue;
      }

      if (character === "," && !inQuotes) {
        row.push(field);
        field = "";
        continue;
      }

      if ((character === "\n" || character === "\r") && !inQuotes) {
        if (character === "\r" && source[index + 1] === "\n") {
          index += 1;
        }
        row.push(field);
        if (row.some((cell) => normalizeCell(cell) !== "")) {
          rows.push(row);
        }
        row = [];
        field = "";
        continue;
      }

      field += character;
    }

    if (inQuotes) {
      throw new Error("Unclosed quoted field in CSV data.");
    }

    if (field !== "" || row.length > 0) {
      row.push(field);
      if (row.some((cell) => normalizeCell(cell) !== "")) {
        rows.push(row);
      }
    }

    if (rows.length === 0) {
      return [];
    }

    const headers = rows[0].map((header) => normalizeCell(header));
    return rows.slice(1).map((cells) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = normalizeCell(cells[index]);
      });
      return record;
    });
  }

  async function fetchCSV(path) {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Unable to load ${path}: ${response.status}`);
    }
    return parseCSV(await response.text());
  }

  function linkifyAcademicNames(value) {
    const text = normalizeCell(value);
    const pattern = /([A-Z][A-Za-z.'-]+[ \u00A0]+[A-Z][A-Za-z.'-]+)[ \u00A0]*\((https?:\/\/[^)]+)\)/g;
    let output = "";
    let cursor = 0;

    for (const match of text.matchAll(pattern)) {
      output += escapeHTML(text.slice(cursor, match.index));
      output += `<a href="${escapeHTML(safeHref(match[2]))}">${escapeHTML(match[1])}</a>`;
      cursor = match.index + match[0].length;
    }

    output += escapeHTML(text.slice(cursor));
    return output;
  }

  function institutionLogo(institute) {
    if (institute.includes("Technical University of Munich")) {
      return { src: "TUM.png", alt: "TUM" };
    }
    if (institute.includes("ETH Zurich")) {
      return { src: "ETH.svg", alt: "ETH" };
    }
    return { src: "NJU.jpg", alt: "NJU" };
  }

  function renderExperience(rows) {
    const items = rows.map((row) => {
      const logo = institutionLogo(row.institute);
      const noteLines = hasValue(row.note)
        ? normalizeCell(row.note).split(/\n+/).map((line) => normalizeCell(line)).filter(Boolean)
        : [];
      const details = noteLines
        .map((line) => `<div class="experience-detail">${linkifyAcademicNames(line)}</div>`)
        .join("");
      const notes = details ? `<div class="experience-notes">${details}</div>` : "";

      return `
        <li class="experience-item">
          <span class="experience-logo" aria-hidden="true">
            <img class="institution-logo" src="${logo.src}" alt="${logo.alt}">
          </span>
          <div class="experience-body">
            <div class="experience-heading">
              <strong class="experience-position">${escapeHTML(row.position)}</strong>
              <span class="experience-time">${escapeHTML(row.time)}</span>
            </div>
            <div class="experience-institute">${escapeHTML(row.institute)}</div>
            ${notes}
          </div>
        </li>`;
    }).join("");

    return `<ul class="experience-list">${items}</ul>`;
  }

  function renderAwards(rows) {
    const items = rows
      .map((row) => `<li>${escapeHTML(row.awardrecog)}</li>`)
      .join("");
    return `<ul class="awards-list">${items}</ul>`;
  }

  function renderFunding(rows) {
    const items = rows.map((row) => {
      const number = hasValue(row.number) ? ` (${escapeHTML(row.number)})` : "";
      return `<li><strong>${escapeHTML(row.role)}</strong>: <u>${escapeHTML(row.source)}${number}</u><br>${escapeHTML(row.title)}</li>`;
    }).join("");
    return `<ul class="funding-list">${items}</ul>`;
  }

  function normalizeName(value) {
    return normalizeCell(value).replace(/\u00A0/g, " ").replace(/\s+/g, " ");
  }

  function nameSet(value) {
    if (!hasValue(value)) {
      return new Set();
    }
    return new Set(normalizeCell(value).split(",").map((name) => normalizeName(name)));
  }

  function renderAuthors(row) {
    const coFirstAuthors = nameSet(row.cofauthor);
    const correspondingAuthors = nameSet(row.corauthor);
    const authors = normalizeCell(row.author).split(",").map((author) => normalizeName(author));

    return authors.map((author) => {
      const suffixMatch = author.match(/\s*(\([^)]*\))$/);
      const suffix = suffixMatch ? ` ${suffixMatch[1]}` : "";
      const name = suffixMatch ? author.slice(0, suffixMatch.index).trim() : author;
      const normalized = normalizeName(name);
      const markers = [
        coFirstAuthors.has(normalized) ? "<sup>#</sup>" : "",
        correspondingAuthors.has(normalized) ? "<sup>*</sup>" : ""
      ].join("");
      const decorated = `${escapeHTML(name)}${markers}${escapeHTML(suffix)}`;
      return normalized === "Shengcheng Yu" ? `<strong class="self-author">${decorated}</strong>` : decorated;
    }).join(", ");
  }

  function publicationStatus(value) {
    const status = normalizeCell(value).toLowerCase();
    if (status === "ac") {
      return `<span class="publication-status"> (Accepted)</span>`;
    }
    if (status === "pb" || status === "" || status === EMPTY_VALUE) {
      return "";
    }
    return `<span class="publication-status"> (${escapeHTML(value)})</span>`;
  }

  function publicationNote(value) {
    if (!hasValue(value)) {
      return "";
    }
    if (normalizeCell(value) === "Best Paper Award") {
      return ` <span class="best-paper"><img src="award.gif" alt="Award"><strong>${escapeHTML(value)}</strong></span>`;
    }
    return ` <span class="paper-note">${escapeHTML(value)}</span>`;
  }

  function renderPublications(rows) {
    const byYear = new Map();
    rows.forEach((row) => {
      if (!byYear.has(row.year)) {
        byYear.set(row.year, []);
      }
      byYear.get(row.year).push(row);
    });

    const years = Array.from(byYear.entries()).map(([year, papers]) => {
      const items = papers.map((paper) => {
        const level = hasValue(paper.level)
          ? `<span class="publication-level">[${escapeHTML(paper.level)}]</span>`
          : "";
        return `
          <li class="publication-item">
            <div class="publication-title-row">
              <a class="publication-title" href="${escapeHTML(safeHref(paper.link))}">${escapeHTML(paper.title)}</a>${publicationStatus(paper.status)}
            </div>
            <div class="publication-authors">${renderAuthors(paper)}.</div>
            <div class="publication-venue">${level}${escapeHTML(paper.venue)}${publicationNote(paper.note)}</div>
          </li>`;
      }).join("");
      return `<h3>${escapeHTML(year)}</h3><ul class="publication-list">${items}</ul>`;
    }).join("");

    return `<p class="publication-note"><sup>#</sup>: Co-first Author &nbsp;&nbsp; <sup>*</sup>: Corresponding Author</p>${years}`;
  }

  function renderServiceItem(row) {
    const venue = escapeHTML(row.venue);
    const year = hasValue(row.year) ? escapeHTML(row.year) : "";
    const role = hasValue(row.role) ? escapeHTML(row.role) : "";

    if (row.type === "Journal Reviewer" || row.type === "External Reviewer") {
      return `<li>${venue}</li>`;
    }
    if (row.type === "Contest on Software Testing") {
      return `<li>${year ? `<b>[${year}]</b> ` : ""}${role ? `${role} for ` : ""}${venue}</li>`;
    }
    if (role) {
      return `<li>${venue}${year ? ` (${year})` : ""}: ${role}</li>`;
    }
    return `<li>${venue}${year ? `: ${year}` : ""}</li>`;
  }

  function renderService(rows) {
    const groups = new Map();
    rows.forEach((row) => {
      if (!groups.has(row.type)) {
        groups.set(row.type, []);
      }
      groups.get(row.type).push(row);
    });

    return Array.from(groups.entries()).map(([type, entries]) => {
      const items = entries.map(renderServiceItem).join("");
      return `<div class="service-group"><strong>${escapeHTML(type)}:</strong><ul class="service-list">${items}</ul></div>`;
    }).join("");
  }

  function renderTalks(rows) {
    const items = rows.map((row) => `
      <li><b>${escapeHTML(row.date)} <a href="${escapeHTML(safeHref(row.link))}">${escapeHTML(row.venue)}</a></b>: "${escapeHTML(row.title)}"</li>`).join("");
    return `<ul class="talk-list">${items}</ul>`;
  }

  function renderTeaching(rows) {
    const groups = new Map();
    rows.forEach((row) => {
      if (!groups.has(row.university)) {
        groups.set(row.university, []);
      }
      groups.get(row.university).push(row);
    });

    return Array.from(groups.entries()).map(([university, entries]) => {
      const items = entries.map((row) => `
        <li><b>${escapeHTML(row.title)}</b>: ${escapeHTML(row.role)} (${escapeHTML(row.period)})</li>`).join("");
      return `<div class="teaching-school">${escapeHTML(university)}</div><ul class="teaching-list">${items}</ul>`;
    }).join("");
  }

  const modules = [
    { target: "experience-content", path: "content/experience.csv", render: renderExperience },
    { target: "awards-content", path: "content/awardrecog.csv", render: renderAwards },
    { target: "funding-content", path: "content/funding.csv", render: renderFunding },
    { target: "publication-content", path: "content/paper.csv", render: renderPublications },
    { target: "service-content", path: "content/service.csv", render: renderService },
    { target: "talks-content", path: "content/talk.csv", render: renderTalks },
    { target: "teaching-content", path: "content/teaching.csv", render: renderTeaching }
  ];

  async function loadModule(module) {
    const target = document.getElementById(module.target);
    try {
      const rows = await fetchCSV(module.path);
      target.innerHTML = module.render(rows);
      target.dataset.loaded = "true";
      return { target: module.target, rows: rows.length };
    } catch (error) {
      console.error(error);
      target.innerHTML = '<p class="content-error">Content could not be loaded.</p>';
      target.dataset.loaded = "false";
      return { target: module.target, rows: 0, error: true };
    }
  }

  window.contentReady = Promise.all(modules.map(loadModule)).then((result) => {
    document.documentElement.dataset.contentLoaded = "true";
    return result;
  });
})();
