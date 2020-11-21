const ExcelJS = require('exceljs');
const fs = require('fs');
const shell = require('child_process').execSync ; 

const proc = async () => {
  console.time("tiempo");
  const arrNamesDir = await readDir();
  const arrNamesFile = await getJsonDataFromXlsx();
  // console.log(arrNamesDir);
  // console.log(arrNamesFile);
  await creacionCarpetaConCopias(arrNamesDir, arrNamesFile);
  console.timeEnd("tiempo");
}

const creacionCarpetaConCopias = async (arrNamesDir, arrNamesFile) =>{
  shell("rm -rf /home/sandy/Documentos/programas/Dummy/script-cambiar-nombres-masivo/imagenes_renamed_models");
  shell("mkdir /home/sandy/Documentos/programas/Dummy/script-cambiar-nombres-masivo/imagenes_renamed_models");
  arrNamesDir.forEach((namesDir) => {
    arrNamesFile.forEach((namesFile) => {
      if (namesDir == namesFile['Imagen ']){
        console.log(namesFile.gmd_id);
        console.log(__dirname+'imagenes_models'+namesDir);
        console.log(__dirname+'imagenes_renamed_models'+namesFile.gmd_id+'.png');
        fs.readdirSync('./imagenes_models').forEach((file) => {
          if(file.trim().replace(/\s+/g, '_').toLowerCase() == namesDir){
            fs.copyFile(
              __dirname+'/imagenes_models/'+file,
              __dirname+'/imagenes_renamed_models/'+namesFile.gmd_id+'.png',
              (err) => {
                if(err){
                  console.log(err);
                }else{
                  console.log("Se guardo imagen",namesFile.gmd_id);
                }
              }
            )
          }
        })
      }
    })
  })
}

const readDir = async () => {
  const filesClean = fs.readdirSync('./imagenes_models').map((file) => {
    return file.trim().replace(/\s+/g, '_').toLowerCase();
  })
  return filesClean;
}

const getJsonDataFromXlsx = async () => {
  console.log("Estoy en la funcion getJsonDataFromXLsx");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('./Imagenes_Modelos.xlsx');
  //console.log(workbook.model.sheets[0]);
  const titles = workbook.model.sheets[0].rows.shift();
  return await getJson(titles, workbook.model.sheets[0].rows);
}

const getJson = async (titles, values) => {
  const arrayJson = [];
  for ([i, value] of values.entries()){
    const rowData = {}
    value.cells.forEach((cell,j) =>{
      const key = titles.cells[j].value;
      const value = cell.value;
      if((key == 'Imagen ' || key == 'gmd_id') && value != undefined){
        const imagesClean = key == 'Imagen ' ? value.trim().replace(/\s+/g, '_').toLowerCase() : null;
        rowData[key] = key == 'Imagen ' ? imagesClean.match(/\.(jpeg|jpg|gif|png)$/) ? imagesClean : imagesClean+'.png' : value
        
      }
      
    });
    if (i == 0){
      console.log(rowData);
    }
    arrayJson.push(rowData);
  }
  return arrayJson;
}

proc();