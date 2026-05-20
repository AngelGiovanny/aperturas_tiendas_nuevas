// generarHash.js
const bcrypt = require('bcrypt');

async function generarHash() {
    const password = "KFC.2026";
    const saltRounds = 10;

    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log("✅ Contraseña: KFC.2026");
        console.log("✅ Hash generado:", hash);
        console.log("\n📝 Copia este hash para usarlo en MongoDB:");
        console.log(hash);
    } catch (error) {
        console.error("Error:", error);
    }
}

generarHash();