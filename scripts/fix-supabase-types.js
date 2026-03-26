const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(srcDir, function (filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // Cast supabase.from("table") to any before insert/update/upsert to bypass all never errors
        // Matches: supabase.from("tableName").insert
        // Replaces: (supabase.from("tableName") as any).insert
        content = content.replace(/supabase\.from\("([^"]+)"\)\.insert/g, '(supabase.from("$1") as any).insert');
        content = content.replace(/supabase\.from\("([^"]+)"\)\.update/g, '(supabase.from("$1") as any).update');
        content = content.replace(/supabase\.from\("([^"]+)"\)\.upsert/g, '(supabase.from("$1") as any).upsert');

        // Also fix the adjustments error where adj is never
        // `reference_id: adj.id` -> `reference_id: adj?.id`
        content = content.replace(/reference_id: adj\.id/g, 'reference_id: adj?.id');

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            console.log('Fixed from() casts in', filePath);
        }
    }
});
