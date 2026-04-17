import { GoogleGenAI } from "@google/genai";
import { Product, Sale } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY || "";

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const inventorySnapshot = (products: Product[], sales: Sale[]) => {
  const lowStock = products
    .filter((p) => p.stockQuantity <= (p.reorderLevel || 3))
    .map((p) => ({
      name: p.name,
      stock: p.stockQuantity,
      reorderLevel: p.reorderLevel,
      price: p.sellingPrice,
      category: p.category,
    }));

  const topSales = sales.slice(-20).map((sale) => ({
    customer: sale.customerName,
    total: sale.grandTotal,
    date: sale.date,
    items: sale.items.map((item) => ({
      name: item.name,
      qty: item.quantity,
      price: item.unitPrice,
      total: item.total,
    })),
  }));

  return {
    totalProducts: products.length,
    totalSales: sales.length,
    lowStock,
    topSales,
  };
};

const fallbackMessage =
  "AI haijawezeshwa bado. Weka API key kwenye `.env.local` kama `VITE_GEMINI_API_KEY=your_key` kisha restart server.";

const buildSimpleReport = (products: Product[], sales: Sale[]) => {
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.grandTotal || 0), 0);
  const lowStockProducts = products.filter((p) => p.stockQuantity <= (p.reorderLevel || 3));
  const bestSellingMap = new Map<string, number>();

  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      bestSellingMap.set(item.name, (bestSellingMap.get(item.name) || 0) + item.quantity);
    });
  });

  const topItems = [...bestSellingMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => `- ${name}: ${qty}`);

  return [
    `Muhtasari wa biashara:`,
    `- Jumla ya bidhaa: ${products.length}`,
    `- Jumla ya mauzo: ${sales.length}`,
    `- Mapato ya jumla: ${totalRevenue.toLocaleString()}`,
    `- Bidhaa zinazoisha: ${lowStockProducts.length}`,
    topItems.length ? `- Bidhaa zinazouzwa zaidi:\n${topItems.join("\n")}` : "- Hakuna data ya mauzo ya kutosha bado.",
  ].join("\n");
};

export async function getInventoryInsights(products: Product[], sales: Sale[]) {
  if (!ai) {
    return buildSimpleReport(products, sales) + `\n\n${fallbackMessage}`;
  }

  try {
    const prompt = `
Wewe ni msaidizi wa biashara kwa mfumo wa duka la vifaa na pikipiki.
Chambua data ifuatayo na andika ripoti kwa Kiswahili:
- toa muhtasari mfupi
- taja bidhaa zinazoisha
- taja bidhaa zinazouzwa zaidi
- toa ushauri 3 wa kuboresha mauzo au stoo

DATA:
${JSON.stringify(inventorySnapshot(products, sales), null, 2)}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || buildSimpleReport(products, sales);
  } catch (error) {
    console.error("Gemini insight error:", error);
    return buildSimpleReport(products, sales) + "\n\nImeshindikana kuwasiliana na Gemini kwa sasa.";
  }
}

export async function getCustomReport(products: Product[], sales: Sale[], userRequest: string) {
  if (!ai) {
    return {
      summary: buildSimpleReport(products, sales),
      hasTable: false,
      table: {
        title: "",
        headers: [],
        rows: [],
      },
      recommendation: fallbackMessage,
    };
  }

  try {
    const prompt = `
Wewe ni mchambuzi wa biashara.
Jibu kwa Kiswahili kwa kutumia data hii ya biashara na ombi la mtumiaji.

OMBI LA MTUMIAJI:
${userRequest}

DATA:
${JSON.stringify(inventorySnapshot(products, sales), null, 2)}

Rudisha:
1. muhtasari mfupi na wa kitaalamu
2. recommendation moja ya vitendo
Usitumie markdown nzito sana.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return {
      summary: response.text || buildSimpleReport(products, sales),
      hasTable: false,
      table: {
        title: "",
        headers: [],
        rows: [],
      },
      recommendation: "Ripoti imetengenezwa na Gemini.",
    };
  } catch (error) {
    console.error("Gemini custom report error:", error);
    return {
      summary: buildSimpleReport(products, sales),
      hasTable: false,
      table: {
        title: "",
        headers: [],
        rows: [],
      },
      recommendation: "Gemini haikujibu kwa sasa, umeonyeshwa ripoti mbadala.",
    };
  }
}

export async function interpretSystemCommand(command: string, products: Product[]) {
  const commandLower = command.toLowerCase();

  if (!ai) {
    const matchedProduct = products.find((product) =>
      commandLower.includes(product.name.toLowerCase())
    );

    if (matchedProduct) {
      const numberMatch = command.match(/-?\d+(\.\d+)?/);
      const value = numberMatch ? Number(numberMatch[0]) : 0;

      if (commandLower.includes("ongeza bei")) {
        return {
          action: "UPDATE_PRICE",
          targetId: matchedProduct.id,
          targetName: matchedProduct.name,
          value,
          valueType: "add",
          reason: `Ongeza bei ya ${matchedProduct.name} kwa ${value}.`,
        };
      }

      if (commandLower.includes("punguza bei")) {
        return {
          action: "UPDATE_PRICE",
          targetId: matchedProduct.id,
          targetName: matchedProduct.name,
          value,
          valueType: "subtract",
          reason: `Punguza bei ya ${matchedProduct.name} kwa ${value}.`,
        };
      }

      if (commandLower.includes("ongeza stock") || commandLower.includes("ongeza stoo")) {
        return {
          action: "UPDATE_STOCK",
          targetId: matchedProduct.id,
          targetName: matchedProduct.name,
          value,
          valueType: "add",
          reason: `Ongeza stoo ya ${matchedProduct.name} kwa ${value}.`,
        };
      }

      if (commandLower.includes("punguza stock") || commandLower.includes("punguza stoo")) {
        return {
          action: "UPDATE_STOCK",
          targetId: matchedProduct.id,
          targetName: matchedProduct.name,
          value,
          valueType: "subtract",
          reason: `Punguza stoo ya ${matchedProduct.name} kwa ${value}.`,
        };
      }
    }

    if (commandLower.includes("punguza bei zote") || commandLower.includes("ongeza bei zote")) {
      const numberMatch = command.match(/-?\d+(\.\d+)?/);
      const value = numberMatch ? Number(numberMatch[0]) : 0;
      return {
        action: "BULK_UPDATE_PRICE",
        value,
        valueType: commandLower.includes("punguza") ? "subtract" : "add",
        reason: `Badilisha bei za bidhaa zote kwa ${value}${commandLower.includes("%") ? "%" : ""}.`,
      };
    }

    return { action: "UNKNOWN", reason: fallbackMessage };
  }

  try {
    const prompt = `
Tafsiri amri ya mtumiaji kwa mfumo wa inventory.
Rudisha JSON pekee bila maelezo ya ziada.

Muundo wa JSON:
{
  "action": "UPDATE_PRICE" | "UPDATE_STOCK" | "BULK_UPDATE_PRICE" | "UNKNOWN",
  "targetId": "string optional",
  "targetName": "string optional",
  "value": number optional,
  "valueType": "set" | "add" | "subtract" optional,
  "reason": "string"
}

Bidhaa:
${JSON.stringify(products.map((p) => ({ id: p.id, name: p.name, price: p.sellingPrice, stock: p.stockQuantity })), null, 2)}

Amri:
${command}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = (response.text || "").replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini command error:", error);
    return { action: "UNKNOWN", reason: "Gemini imeshindwa kutafsiri amri kwa sasa." };
  }
}
