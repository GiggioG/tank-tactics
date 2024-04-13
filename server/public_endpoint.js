import * as fs from "fs";
import * as path from "path";

export default function public_endpoint(parsed, req, res) {
    const baseDir = process.cwd();
    let { pathname, query } = parsed;
    let filepath = null;
    if (pathname.startsWith("/lib")) {
        let libDir = path.join(baseDir, "lib"); //.replace(/\\/g, '/');
        filepath = path.join(libDir, pathname.replace("lib/", ""));
        if (!filepath.startsWith(libDir)) { return; }
    } else {
        let publicDir = path.join(baseDir, "public"); //.replace(/\\/g, '/');
        if (pathname == "/") { pathname = `/${db.status}.html`; }
        filepath = path.join(publicDir, pathname);
        if (!filepath.startsWith(publicDir)) { return; }
    }
    if (!fs.existsSync(filepath)) {
        if (filepath.endsWith("/")) { filepath = filepath.slice(0, -1); }
        filepath += ".html";
        if (!fs.existsSync(filepath)) {
            res.writeHead(404);
            return res.end(`<h1 style="color:red">Error 404</h1><p style="color:darkred">File not found.</p>`);
        }
    }

    if (filepath.endsWith(".js")) {
        res.writeHead(200, {
            "Content-Type": "text/javascript"
        });
    }
    return fs.createReadStream(filepath).pipe(res);
}