let includeCache = {};

async function getIncludeHTML(incl) {
    if (includeCache[incl]) { return includeCache[incl]; }

    let raw = await fetch(`./includes/${incl}.html`);
    if (raw.status == 200) {
        let text = await raw.text();
        includeCache[incl] = text;
        return text;
    } else {
        throw new Error(`Include ${incl} didn't return correct html.`);
    }
}

async function addIncludes() {
    let list = Array.from(document.querySelectorAll("i.incl")).map(e=>({
        element: e,
        includeName: e.getAttribute("data-incl")
    }));

    for(include in list){
        const incl = list[include];
        incl.element.outerHTML = await await getIncludeHTML(incl.includeName);;
    }

    document.body.dispatchEvent(new Event("processedIncludes"));
}

addIncludes();