import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Client } from '../types';

export const exportToExcel = (data: Client[], filename: string = 'clients') => {
  // Main data sheet
  const clientData = data.map(client => ({
    'Client Name': client.client_name,
    'Domain URL': client.domain_url,
    'Client ID': client.client_id,
    'Latest Pull Date': client.latest_pull_date ? new Date(client.latest_pull_date).toLocaleDateString() : 'Never',
    'Latest Pull By': client.latest_pull_by || 'N/A',
    'GSOS Version': client.gsos_version || 'N/A',
    'Created Date': client.created_at ? new Date(client.created_at).toLocaleDateString() : 'N/A'
  }));
  
  // Summary sheet
  const stats = {
    'Total Clients': data.length,
    'Clients with Pull History': data.filter(c => c.latest_pull_date).length,
    'Clients without Pull History': data.filter(c => !c.latest_pull_date).length,
    'Different GSOS Versions': Array.from(new Set(data.map(c => c.gsos_version).filter(Boolean))).length,
    'Report Generated': new Date().toLocaleString()
  };
  
  const summaryData = Object.entries(stats).map(([key, value]) => ({ Metric: key, Value: value }));
  
  // Version breakdown
  const versionStats = data.reduce((acc, client) => {
    const version = client.gsos_version || 'No Version';
    acc[version] = (acc[version] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const versionData = Object.entries(versionStats).map(([version, count]) => ({ 
    'GSOS Version': version, 
    'Client Count': count 
  }));
  
  const workbook = XLSX.utils.book_new();
  
  // Add sheets
  const clientSheet = XLSX.utils.json_to_sheet(clientData);
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  const versionSheet = XLSX.utils.json_to_sheet(versionData);
  
  XLSX.utils.book_append_sheet(workbook, clientSheet, 'Client Data');
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  XLSX.utils.book_append_sheet(workbook, versionSheet, 'Version Breakdown');
  
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToCSV = (data: Client[], filename: string = 'clients') => {
  // Enhanced CSV with more details
  const csvData = data.map(client => ({
    'Client Name': client.client_name,
    'Domain URL': client.domain_url,
    'Client ID': client.client_id,
    'Latest Pull Date': client.latest_pull_date ? new Date(client.latest_pull_date).toLocaleDateString() : 'Never',
    'Latest Pull By': client.latest_pull_by || 'N/A',
    'GSOS Version': client.gsos_version || 'N/A',
    'Created Date': client.created_at ? new Date(client.created_at).toLocaleDateString() : 'N/A',
    'Last Updated': client.updated_at ? new Date(client.updated_at).toLocaleDateString() : 'N/A'
  }));
  
  // Add header with metadata
  const header = [
    `# GSOS Client Management Report`,
    `# Generated on: ${new Date().toLocaleString()}`,
    `# Total Clients: ${data.length}`,
    `# Clients with Pull History: ${data.filter(c => c.latest_pull_date).length}`,
    ``,
    ``
  ].join('\n');
  
  const worksheet = XLSX.utils.json_to_sheet(csvData);
  const csv = header + XLSX.utils.sheet_to_csv(worksheet);
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPDF = (data: Client[], filename: string = 'clients') => {
  const doc = new jsPDF();
  
  // Header with gradient-like effect
  doc.setFillColor(102, 126, 234);
  doc.rect(0, 0, 210, 40, 'F');
  
  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('GSOS CLIENT MANAGEMENT REPORT', 14, 20);
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 30);
  
  // Statistics section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary Statistics', 14, 55);
  
  const stats = {
    total: data.length,
    withPulls: data.filter(c => c.latest_pull_date).length,
    versions: Array.from(new Set(data.map(c => c.gsos_version).filter(Boolean))).length
  };
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Clients: ${stats.total}`, 14, 65);
  doc.text(`Clients with Pull History: ${stats.withPulls}`, 14, 72);
  doc.text(`Different GSOS Versions: ${stats.versions}`, 14, 79);
  
  // Table data
  const tableData = data.map(client => [
    client.client_name,
    client.domain_url,
    client.client_id,
    client.latest_pull_date ? new Date(client.latest_pull_date).toLocaleDateString() : 'Never',
    client.latest_pull_by || 'N/A',
    client.gsos_version || 'N/A'
  ]);
  
  autoTable(doc, {
    head: [['Client Name', 'Domain URL', 'Client ID', 'Latest Pull', 'Pull By', 'Version']],
    body: tableData,
    startY: 90,
    theme: 'striped',
    headStyles: {
      fillColor: [102, 126, 234],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 45 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 25 },
      5: { cellWidth: 20 }
    }
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 10);
    doc.text('GSOS Client Management System', doc.internal.pageSize.width - 14, doc.internal.pageSize.height - 10, { align: 'right' });
  }
  
  doc.save(`${filename}.pdf`);
};