const fs = require("fs");
const idl = JSON.parse(fs.readFileSync("./target/idl/contracts.json", "utf8"));
console.log("IDL Accounts:", idl.accounts);
if (idl.accounts && Array.isArray(idl.accounts)) {
  idl.accounts.forEach((acc, i) => {
    console.log(`\nAccount #${i}:`, acc.name);
    if (acc.type && acc.type.fields) {
      console.log("  Fields:", acc.type.fields);
    } else {
      console.log("  ❌ PAS DE FIELDS !");
    }
  });
} else {
  console.log("❌ PAS DE SECTION ACCOUNTS DANS L'IDL");
}
