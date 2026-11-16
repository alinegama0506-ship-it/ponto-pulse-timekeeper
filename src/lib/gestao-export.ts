import {paraCSV} from './preferencias';
export async function exportarGestao(rows:Record<string,unknown>[],formato:'csv'|'xlsx',nome:string){
 let blob:Blob;
 if(formato==='csv')blob=new Blob([paraCSV(rows)],{type:'text/csv;charset=utf-8'});
 else {const {default:ExcelJS}=await import('exceljs');const workbook=new ExcelJS.Workbook();const sheet=workbook.addWorksheet('Marcações');const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))];sheet.columns=keys.map(k=>({header:k,key:k,width:24}));rows.forEach(row=>sheet.addRow(row));sheet.views=[{state:'frozen',ySplit:1}];sheet.getRow(1).font={bold:true};const buffer=await workbook.xlsx.writeBuffer();blob=new Blob([new Uint8Array(buffer)],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});}
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${nome}.${formato}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}