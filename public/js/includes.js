let includeCache = {};

async function getIncludeHTML(incl) {
    if (includeCache[incl.name]) { return includeCache[incl.name]; }

    let raw = await fetch(`./includes/${incl.html}.html`);
    if (raw.status == 200) {
        let text = await raw.text();
        includeCache[incl.name] = text;
        return text;
    } else {
        throw new Error(`Include ${incl.name} didn't return correct html.`);
    }
}

let queuedScripts = [];

async function addIncludes() {
    let includes = {};
    document.querySelector("script#includes")
        .attributes["data-includes"].value
        .split(',')
        .map(e => e.split(':'))
        .forEach(e => includes[e[0]] = {
            name: e[0],
            html: e[1],
            js: (e.length == 3 ? e[2] : null)
        });

    while (document.querySelectorAll(`i.incl`).length != 0) {
        for (inclName in includes) {
            const incl = includes[inclName];

            let elements = Array.from(document.querySelectorAll(`i.incl[data-incl="${incl.name}"]`));
            for (el of elements) {
                let text = await getIncludeHTML(incl);
                el.outerHTML = text;
            }

            if (incl.js && !queuedScripts.includes(incl.name)) {
                let inclMain = (await import(`../includes/${incl.js}.js`)).default;
                queuedScripts.push(incl.name);
                await inclMain();
            }
        }
    }
}

addIncludes()
    .then(main);