import { useCallback } from 'react';

interface ExportColumn {
  title: string;
  dataIndex: string;
  render?: (value: any, record: any) => string;
}

function formatRows(data: Record<string, any>[], columns: ExportColumn[]) {
  return data.map((row) => {
    const obj: Record<string, any> = {};
    columns.forEach((col) => {
      obj[col.title] = col.render
        ? col.render(row[col.dataIndex], row)
        : row[col.dataIndex] ?? '';
    });
    return obj;
  });
}

export function useExport() {
  const exportCSV = useCallback(
    async (data: Record<string, any>[], columns: ExportColumn[], fileName: string) => {
      const { saveAs } = await import('file-saver');
      const header = columns.map((c) => c.title).join(',');
      const rows = data.map((row) =>
        columns
          .map((col) => {
            const val = col.render
              ? col.render(row[col.dataIndex], row)
              : row[col.dataIndex];
            const str = String(val ?? '');
            return str.includes(',') ? `"${str}"` : str;
          })
          .join(','),
      );
      const csv = [header, ...rows].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
      saveAs(blob, `${fileName}.csv`);
    },
    [],
  );

  const exportExcel = useCallback(
    async (data: Record<string, any>[], columns: ExportColumn[], fileName: string) => {
      const XLSX = await import('xlsx');
      const sheetData = formatRows(data, columns);
      const ws = XLSX.utils.json_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    },
    [],
  );

  return { exportCSV, exportExcel };
}
