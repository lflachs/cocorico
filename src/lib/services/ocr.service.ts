import { DocumentAnalysisClient, AzureKeyCredential } from '@azure/ai-form-recognizer';

/**
 * OCR Service
 * Azure Document Intelligence integration for receipt/invoice processing
 */

type ExtractedLineItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
};

type OcrResult = {
  supplierName: string;
  date: Date;
  totalAmount: number;
  items: ExtractedLineItem[];
};

type MenuTextResult = {
  content: string;
  paragraphs: string[];
  tables: { cells: string[][] }[];
};

export class OcrService {
  private client: DocumentAnalysisClient | null = null;

  constructor() {
    const endpoint = process.env.AZURE_DOC_INTELLIGENCE_ENDPOINT;
    const apiKey = process.env.AZURE_DOC_INTELLIGENCE_KEY;

    if (endpoint && apiKey) {
      this.client = new DocumentAnalysisClient(endpoint, new AzureKeyCredential(apiKey));
    }
  }

  async processReceipt(fileBuffer: Buffer): Promise<OcrResult> {
    if (!this.client) {
      throw new Error(
        'Azure Document Intelligence not configured. Please set AZURE_DOC_INTELLIGENCE_ENDPOINT and AZURE_DOC_INTELLIGENCE_KEY'
      );
    }

    // Use prebuilt receipt model
    const poller = await this.client.beginAnalyzeDocument('prebuilt-receipt', fileBuffer);
    const result = await poller.pollUntilDone();

    if (!result.documents || result.documents.length === 0) {
      throw new Error('No receipt data found in document');
    }

    const receipt = result.documents[0];
    const fields = receipt.fields;

    // Extract supplier name
    const supplierName =
      fields?.MerchantName?.content ||
      fields?.VendorName?.content ||
      'Unknown Supplier';

    // Extract date
    let date = new Date();
    if (fields?.TransactionDate?.value) {
      const dateValue = fields.TransactionDate.value;
      if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      }
    }

    // Extract total amount
    const totalAmount = fields?.Total?.value || 0;

    // Extract line items
    const items: ExtractedLineItem[] = [];

    if (fields?.Items?.values) {
      for (const item of fields.Items.values) {
        const itemFields = item.properties;

        const description = itemFields?.Description?.content || 'Unknown Item';
        const quantity = itemFields?.Quantity?.value || 1;
        const totalPrice = itemFields?.TotalPrice?.value || 0;
        const unitPrice = quantity > 0 ? totalPrice / quantity : totalPrice;

        // Try to extract unit from description or default to 'pc'
        let unit = 'pc';
        const descLower = description.toLowerCase();
        if (descLower.includes('kg') || descLower.includes('kilo')) {
          unit = 'kg';
        } else if (descLower.includes('l') || descLower.includes('liter')) {
          unit = 'L';
        } else if (descLower.includes('g') || descLower.includes('gram')) {
          unit = 'g';
        }

        items.push({
          description,
          quantity,
          unit,
          unitPrice,
          totalPrice,
        });
      }
    }

    // If no items were extracted, try to get them from individual line items
    if (items.length === 0 && result.tables && result.tables.length > 0) {
      // Fallback: extract from tables
      const table = result.tables[0];
      for (const cell of table.cells) {
        // This is a simplified extraction - in production you'd parse table structure
        if (cell.content && cell.content.trim()) {
          items.push({
            description: cell.content,
            quantity: 1,
            unit: 'pc',
            unitPrice: 0,
            totalPrice: 0,
          });
        }
      }
    }

    return {
      supplierName,
      date,
      totalAmount: typeof totalAmount === 'number' ? totalAmount : 0,
      items,
    };
  }

  async processInvoice(fileBuffer: Buffer): Promise<OcrResult> {
    if (!this.client) {
      throw new Error(
        'Azure Document Intelligence not configured. Please set AZURE_DOC_INTELLIGENCE_ENDPOINT and AZURE_DOC_INTELLIGENCE_KEY'
      );
    }

    // Use prebuilt invoice model
    const poller = await this.client.beginAnalyzeDocument('prebuilt-invoice', fileBuffer);
    const result = await poller.pollUntilDone();

    if (!result.documents || result.documents.length === 0) {
      throw new Error('No invoice data found in document');
    }

    const invoice = result.documents[0];
    const fields = invoice.fields;

    // Extract vendor name
    const supplierName =
      fields?.VendorName?.content ||
      fields?.MerchantName?.content ||
      'Unknown Supplier';

    // Extract date
    let date = new Date();
    if (fields?.InvoiceDate?.value) {
      const dateValue = fields.InvoiceDate.value;
      if (typeof dateValue === 'string') {
        date = new Date(dateValue);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      }
    }

    // Extract total amount
    const totalAmount = fields?.InvoiceTotal?.value || fields?.Total?.value || 0;

    // Extract line items
    const items: ExtractedLineItem[] = [];

    if (fields?.Items?.values) {
      for (const item of fields.Items.values) {
        const itemFields = item.properties;

        const description = itemFields?.Description?.content || 'Unknown Item';
        const quantity = itemFields?.Quantity?.value || 1;
        const amount = itemFields?.Amount?.value || 0;
        const unitPrice = itemFields?.UnitPrice?.value || (quantity > 0 ? amount / quantity : 0);

        // Extract unit
        let unit = 'pc';
        const unitStr = itemFields?.Unit?.content?.toLowerCase() || '';
        if (unitStr.includes('kg') || unitStr.includes('kilo')) {
          unit = 'kg';
        } else if (unitStr.includes('l') || unitStr.includes('liter')) {
          unit = 'L';
        } else if (unitStr.includes('g') || unitStr.includes('gram')) {
          unit = 'g';
        }

        items.push({
          description,
          quantity,
          unit,
          unitPrice,
          totalPrice: amount,
        });
      }
    }

    return {
      supplierName,
      date,
      totalAmount: typeof totalAmount === 'number' ? totalAmount : 0,
      items,
    };
  }

  async processMenu(fileBuffer: Buffer): Promise<MenuTextResult> {
    if (!this.client) {
      throw new Error(
        'Azure Document Intelligence not configured. Please set AZURE_DOC_INTELLIGENCE_ENDPOINT and AZURE_DOC_INTELLIGENCE_KEY'
      );
    }

    // Use prebuilt-document model for general text extraction
    const poller = await this.client.beginAnalyzeDocument('prebuilt-document', fileBuffer);
    const result = await poller.pollUntilDone();

    // Extract full content in reading order
    const content = result.content || '';

    // Extract paragraphs
    const paragraphs: string[] = [];
    if (result.paragraphs) {
      for (const paragraph of result.paragraphs) {
        if (paragraph.content && paragraph.content.trim()) {
          paragraphs.push(paragraph.content.trim());
        }
      }
    }

    // Extract tables
    const tables: { cells: string[][] }[] = [];
    if (result.tables) {
      for (const table of result.tables) {
        const rows: string[][] = [];
        const maxRow = Math.max(...table.cells.map(cell => cell.rowIndex));
        const maxCol = Math.max(...table.cells.map(cell => cell.columnIndex));

        // Initialize 2D array
        for (let i = 0; i <= maxRow; i++) {
          rows[i] = new Array(maxCol + 1).fill('');
        }

        // Fill cells
        for (const cell of table.cells) {
          rows[cell.rowIndex][cell.columnIndex] = cell.content || '';
        }

        tables.push({ cells: rows });
      }
    }

    return {
      content,
      paragraphs,
      tables,
    };
  }
}

export const ocrService = new OcrService();
