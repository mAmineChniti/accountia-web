import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedFileData {
  headers: string[];
  rows: Record<string, unknown>[];
}

export const parseFile = async (file: File): Promise<ParsedFileData> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve({
            headers: results.meta.fields || [],
            rows: results.data as Record<string, unknown>[],
          });
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  } else if (extension === 'xls' || extension === 'xlsx') {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Extract headers from the first row of JSON if available, or from worksheet
    const headers = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
    })[0] as string[];

    return {
      headers: headers || [],
      rows: jsonData as Record<string, unknown>[],
    };
  } else {
    throw new Error('Unsupported file format');
  }
};

export const generateCorrectedFile = (
  originalFile: File,
  correctedData: Record<string, unknown>[],
  headers: string[]
): File => {
  const extension = originalFile.name.split('.').pop()?.toLowerCase();
  const fileName = `corrected_${originalFile.name}`;

  if (extension === 'csv') {
    // Reorder headers to be first if possible
    const csv = Papa.unparse({
      fields: headers,
      data: correctedData,
    });
    return new File([csv], fileName, { type: 'text/csv' });
  } else {
    // Default to XLSX for Excel files
    const worksheet = XLSX.utils.json_to_sheet(correctedData, {
      header: headers,
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
    });
    return new File([excelBuffer], fileName.replace(/\.[^./]+$/, '.xlsx'), {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }
};
