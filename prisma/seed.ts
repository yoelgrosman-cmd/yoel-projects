import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { join, resolve } from "path";
import { config } from "dotenv";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const dbUrl = process.env.DATABASE_URL || "file:./dev.db";
const filePath = dbUrl.startsWith("file:") ? dbUrl.slice(5) : dbUrl;
const dbPath = filePath.startsWith("./") || filePath.startsWith(".\\")
  ? resolve(process.cwd(), filePath)
  : filePath;


const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\s]+/g, "-")
    .replace(/[^\w\u0590-\u05ff\-]/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
    || Math.random().toString(36).substring(2, 8);
}

const categoryMapping: Record<string, { parent: string; child: string }> = {
  // Bikes
  "אופניים הרים קדמי": { parent: "אופניים", child: "אופני הרים קדמי" },
  "אופניים הרים שיכוך מלא": { parent: "אופניים", child: "אופני הרים שיכוך מלא" },
  "אופניים ילדים": { parent: "אופניים", child: "אופני ילדים" },
  "אופניים עיר": { parent: "אופניים", child: "אופני עיר" },
  "אופניים עיר נשים": { parent: "אופניים", child: "אופני עיר נשים" },
  "אופניים כביש": { parent: "אופניים", child: "אופני כביש" },
  "אופניים גרביל": { parent: "אופניים", child: "אופני גרביל" },
  "אופניים מתקפלים": { parent: "אופניים", child: "אופני מתקפלים" },
  // Wheels/tires
  "גלגלים": { parent: "גלגלים וצמירים", child: "גלגלים" },
  "צמירים": { parent: "גלגלים וצמירים", child: "צמירים" },
  "פנימיות": { parent: "גלגלים וצמירים", child: "פנימיות" },
  // Helmets
  "קסדות": { parent: "קסדות", child: "קסדות" },
  // Locks
  "מנעולים": { parent: "מנעולים", child: "מנעולים" },
  // Bags
  "תיקים": { parent: "תיקים", child: "תיקים" },
  "תיקי גב": { parent: "תיקים", child: "תיקי גב" },
  // Saddles
  "אוכפים": { parent: "אוכפים", child: "אוכפים" },
  // Lights
  "פנסים": { parent: "פנסים", child: "פנסים" },
  // Tools
  "כלי אחזקה": { parent: "כלי אחזקה", child: "כלים ואחזקה" },
  // Brakes
  "בלמים": { parent: "בלמים", child: "בלמים" },
  "רפידות בלמים": { parent: "בלמים", child: "רפידות בלמים" },
  // Drivetrain
  "הילוכים": { parent: "חלקי הילוך", child: "מעבירים ושיפטרים" },
  // Grips
  "גריפים": { parent: "גריפים ומרפקים", child: "גריפים" },
  // Pedals
  "פדלים": { parent: "פדלים", child: "פדלים" },
  // Stems
  "גבעולים": { parent: "גבעולים וסטמים", child: "גבעולים וסטמים" },
  // Tires/tubes
  "צמיגים": { parent: "צמיגים ופנימיות", child: "צמיגים" },
  // Pumps
  "משאבות": { parent: "משאבות", child: "משאבות" },
};

async function main() {
  console.log("🌱 Starting seed...");

  // Create admin user
  const adminPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "Admin123!",
    12
  );
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@bilubikes.co.il" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@bilubikes.co.il",
      name: "מנהל בילו בייקס",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create categories
  const parentCategoryNames = [
    "אופניים",
    "גלגלים וצמירים",
    "קסדות",
    "מנעולים",
    "תיקים",
    "אוכפים",
    "פנסים",
    "כלי אחזקה",
    "בלמים",
    "חלקי הילוך",
    "גריפים ומרפקים",
    "פדלים",
    "גבעולים וסטמים",
    "צמיגים ופנימיות",
    "משאבות",
  ];

  const parentCats: Record<string, string> = {};
  let order = 0;
  for (const name of parentCategoryNames) {
    const slug = slugify(name);
    const cat = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, order: order++ },
    });
    parentCats[name] = cat.id;
  }

  // Create sub-categories
  const subCategoryDefs: Record<string, string[]> = {
    "אופניים": ["אופני הרים קדמי", "אופני הרים שיכוך מלא", "אופני ילדים", "אופני עיר", "אופני עיר נשים", "אופני כביש", "אופני גרביל", "אופני מתקפלים"],
    "גלגלים וצמירים": ["גלגלים", "סט גלגלים", "צמירים", "פנימיות", "TPU", "שפיצים"],
    "מנעולים": ["חומיות", "כבל", "מתקפל", "פרסה"],
    "תיקים": ["תיקי גב", "תיקי צד", "מחזיק מים"],
    "פנסים": ["פנס קדמי", "פנס אחורי", "סט פנסים"],
    "בלמים": ["ידיות בלם", "קלמפרים", "רוטורים", "כבלי בלם", "רפידות בלם"],
    "כלי אחזקה": ["כלים", "שמנים ותחזוקה"],
    "חלקי הילוך": ["מעבירים", "שיפטרים", "שרשראות", "קסטות", "LTWOO"],
    "גריפים ומרפקים": ["גריפים", "מרפקים"],
    "גבעולים וסטמים": ["גבעולים", "סטמים"],
    "צמיגים ופנימיות": ["צמיגים", "פנימיות"],
  };

  const subCats: Record<string, string> = {};
  for (const [parentName, children] of Object.entries(subCategoryDefs)) {
    const parentId = parentCats[parentName];
    if (!parentId) continue;
    for (const childName of children) {
      const slug = slugify(childName);
      const cat = await prisma.category.upsert({
        where: { slug },
        update: {},
        create: { name: childName, slug, parentId, order: 0 },
      });
      subCats[childName] = cat.id;
    }
  }

  console.log(`✅ Categories created`);

  // Parse TSV data if available
  const tsvPath = join(process.cwd(), "prisma", "products.tsv");
  let tsvData: string | null = null;
  try {
    tsvData = readFileSync(tsvPath, "utf-8");
  } catch {
    console.log("ℹ️  No products.tsv found, creating sample products");
  }

  if (tsvData) {
    await importFromTSV(tsvData, parentCats, subCats);
  } else {
    await createSampleProducts(parentCats);
  }

  console.log("🎉 Seed completed!");
}

async function importFromTSV(
  tsvData: string,
  parentCats: Record<string, string>,
  subCats: Record<string, string>
) {
  const lines = tsvData.trim().split("\n");
  const headers = lines[0].split("\t");

  const getCol = (row: string[], name: string) => {
    const idx = headers.indexOf(name);
    return idx >= 0 ? (row[idx] || "").trim() : "";
  };

  let count = 0;
  const usedSlugs = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split("\t");
    if (row.length < 3) continue;

    const name = getCol(row, "name");
    if (!name) continue;

    let slug = slugify(name);
    // Ensure unique slug
    let slugAttempt = slug;
    let n = 1;
    while (usedSlugs.has(slugAttempt)) {
      slugAttempt = `${slug}-${n++}`;
    }
    slug = slugAttempt;
    usedSlugs.add(slug);

    const priceStr = getCol(row, "consumer_price");
    const price = parseFloat(priceStr) || 0;
    if (price === 0) continue;

    const comparePriceStr = getCol(row, "compare_price") || getCol(row, "store_price");
    const comparePrice = parseFloat(comparePriceStr) || null;

    const imageUrl = getCol(row, "image_url");
    const imageGalleryStr = getCol(row, "image_gallery");
    let images: string[] = [];
    if (imageUrl) images.push(imageUrl);
    if (imageGalleryStr) {
      try {
        const gallery = JSON.parse(imageGalleryStr);
        if (Array.isArray(gallery)) images = [...images, ...gallery];
      } catch {}
    }

    const categoryName = getCol(row, "category");
    const subcategoryName = getCol(row, "subcategory");

    // Resolve category
    let categoryId: string | null = null;
    if (subcategoryName && subCats[subcategoryName]) {
      categoryId = subCats[subcategoryName];
    } else if (categoryName && parentCats[categoryName]) {
      categoryId = parentCats[categoryName];
    } else {
      // Try partial match
      for (const [key, id] of Object.entries(parentCats)) {
        if (categoryName && (key.includes(categoryName) || categoryName.includes(key))) {
          categoryId = id;
          break;
        }
      }
    }

    const outOfStock = getCol(row, "out_of_stock");
    const stock = outOfStock === "true" || outOfStock === "1" ? 0 : 100;

    const isFeaturedStr = getCol(row, "is_featured");
    const featured = isFeaturedStr === "true" || isFeaturedStr === "1";

    const isActiveStr = getCol(row, "is_active");
    const active = isActiveStr !== "false" && isActiveStr !== "0";

    const sku = getCol(row, "sku") || null;
    const description = getCol(row, "description") || null;

    // Detect RL brand
    const brand = name.startsWith("RL ") || name.includes(" RL ") ? "RL" : null;

    // Parse sizes and colors
    const sizesStr = getCol(row, "available_sizes");
    const colorsStr = getCol(row, "available_colors");
    const variantsData: { name: string; value: string; stock: number }[] = [];

    if (sizesStr) {
      try {
        const sizes = JSON.parse(sizesStr);
        if (Array.isArray(sizes)) {
          for (const size of sizes) {
            variantsData.push({
              name: "גודל",
              value: typeof size === "string" ? size : String(size),
              stock: stock > 0 ? Math.floor(stock / sizes.length) : 0,
            });
          }
        }
      } catch {}
    }

    if (colorsStr) {
      try {
        const colors = JSON.parse(colorsStr);
        if (Array.isArray(colors)) {
          for (const color of colors) {
            variantsData.push({
              name: "צבע",
              value: typeof color === "string" ? color : String(color),
              stock: stock > 0 ? Math.floor(stock / colors.length) : 0,
            });
          }
        }
      } catch {}
    }

    try {
      await prisma.product.upsert({
        where: { slug },
        update: { price, featured, active },
        create: {
          name,
          slug,
          description,
          price,
          comparePrice: comparePrice && comparePrice > price ? comparePrice : null,
          sku,
          stock,
          images: JSON.stringify(images),
          categoryId,
          brand,
          featured,
          active,
          variants: { create: variantsData },
        },
      });
      count++;
      if (count % 50 === 0) console.log(`  Imported ${count} products...`);
    } catch (err) {
      // Skip duplicates silently
    }
  }

  console.log(`✅ Imported ${count} products from TSV`);
}

async function createSampleProducts(parentCats: Record<string, string>) {
  const sampleProducts = [
    {
      name: "RL POKA 27.5 הרים קדמי",
      price: 2499,
      comparePrice: 2999,
      brand: "RL",
      featured: true,
      categoryId: parentCats["אופניים"],
      description: "אופניי הרים קדמיים עם מזלג 100מ״מ. מסגרת אלומיניום קלת משקל, שינוי 21 הילוכים.",
    },
    {
      name: "RL LARK 26 עיר",
      price: 1899,
      brand: "RL",
      featured: true,
      categoryId: parentCats["אופניים"],
      description: "אופני עיר נוחים ואמינים. מושלמים לרכיבה יומיומית בעיר.",
    },
    {
      name: "RL ZOE 16 ילדים",
      price: 799,
      comparePrice: 999,
      brand: "RL",
      featured: true,
      categoryId: parentCats["אופניים"],
      description: "אופני ילדים 16 אינץ' עם גלגלי עזר נשלפים.",
    },
    {
      name: "קסדת POKA MTB",
      price: 299,
      brand: "RL",
      featured: false,
      categoryId: parentCats["קסדות"],
      description: "קסדת הרים עם הגנה מלאה ואוורור מעולה.",
    },
    {
      name: "מנעול שרשרת כבל",
      price: 89,
      brand: null,
      featured: false,
      categoryId: parentCats["מנעולים"],
    },
    {
      name: "תיק גב Hydro 20L",
      price: 249,
      brand: "RL",
      featured: false,
      categoryId: parentCats["תיקים"],
    },
    {
      name: "פנס קדמי USB 800LM",
      price: 149,
      brand: "RL",
      featured: false,
      categoryId: parentCats["פנסים"],
    },
    {
      name: "רפידות דיסק RL KSD",
      price: 69,
      brand: "RL",
      featured: false,
      categoryId: parentCats["בלמים"],
    },
  ];

  for (const p of sampleProducts) {
    const slug = slugify(p.name);
    await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        name: p.name,
        slug,
        description: p.description || null,
        price: p.price,
        comparePrice: p.comparePrice || null,
        sku: null,
        stock: 50,
        images: JSON.stringify([]),
        categoryId: p.categoryId || null,
        brand: p.brand,
        featured: p.featured,
        active: true,
      },
    });
  }
  console.log(`✅ Created ${sampleProducts.length} sample products`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
