const ExcelJS = require('exceljs');
const fs = require('fs');
const shell = require('child_process').execSync ; 

const procedure = async () => {
  try {

    const activitie = false;
    const jsonData = await getJsonDataFromXlsx()

    // leemos el directorio

    if (activitie) {
      console.log(__dirname + '/Imagenes_Modelos')
      shell('rm -rf /home/roberto/Escritorio/script/Imagenes_Modelos_Renamed')
      shell('mkdir /home/roberto/Escritorio/script/Imagenes_Modelos_Renamed')
      fs.readdirSync('./Imagenes_Modelos').forEach((file, i) => {        
        // fs.renameSync(`./Imagenes_Modelos/${file}`, `./Imagenes_Modelos/${jsonData[file]}+.png`);
        const imageKey = file.trim().split(' ').join('_').toLowerCase()
        if ( jsonData[imageKey] ) {

          fs.copyFile(
            __dirname + '/Imagenes_Modelos/' + file,
            __dirname + '/Imagenes_Modelos_Renamed/' + jsonData[imageKey] + '.png',
            (err) => {
              if (err){
                console.log('error ' + file)
              }
              else {
                fs.unlinkSync(__dirname + '/Imagenes_Modelos/' + file)
                // console.log('se agrego: ' + file)
              }
            }
          )          
        }
      });
    }

    if (!activitie) {
      console.log(fs.readdirSync('./Imagenes_Modelos').length)
      console.log(fs.readdirSync('./Imagenes_Modelos_Renamed').length)
    }
    
    } catch (error) {
        console.error('error en insercion de lotes', error);
    }
}

const getJsonDataFromXlsx = async () => {
  //leemos el archivo :D
  const arrayLotes = [];
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('./Imagenes_Modelos.xlsx');
  const lotes = chunkArrayInGroups(workbook.model.sheets[0].rows, 20);
  // console.log(lotes)
  const titles = workbook.model.sheets[0].rows.shift();
  // convertimos a json
  for (const [i, lote] of lotes.entries()) {
    const lotePromesas = await createPromise(titles, lote, i);
    const resultsPromises = await Promise.all(lotePromesas);
    arrayLotes.push(resultsPromises);
  }
  
  // console.log(arrayLotes);
  //Obtenemos solo los datos que necesitamos
  const arrayIdAndImage =  arrayLotes.reduce((a, b) => a.concat(b), []).map(element => {
    const imageSchrondiger = element['Imagen ']
    const image = imageSchrondiger.trim().split(' ').join('_').toLowerCase().match(/\.(jpeg|jpg|gif|png)$/) ? element['Imagen '] : element['Imagen '].replace(/\s/g, "_").trim().toLowerCase()+'.png'
    return {
      id : element.gmd_id,
      image : image
  
    }
  });

  console.log('numero de imagenes en el excel', arrayIdAndImage.length);

  return arrayIdAndImage.reduce(
    (obj, item) => Object.assign(obj, { [item.image]: item.id }), {});
}

const chunkArrayInGroups = (arr, size) =>{
    const myArray = [];
    // iniciamos la lectura en 1 porque la linea de titulo sigue en el archivo
    for (let i = 1; i < arr.length - 1; i += size) {
        myArray.push(arr.slice(i, i+size));
    }
    return myArray;
};

const createPromise = (titles, subArray, i) => {
    return new Promise( async (resolve) => {
      const objectsArray = [];
      for (const [i, sample] of subArray.entries()) {
        const result = getJSON(titles, sample, i);
        if (result) {
          objectsArray.push(result);
        }
      }
      resolve(objectsArray);
    });
  };

procedure();







// 'use strict';
// const Excel = require('exceljs');
// const {chunkArrayInGroups} = require('../utils/arrayFunctions');
// const moment = require('moment');

// const getDataFromExcelUsingPromises = async (stream, numGroups = 200) => {
//   const arrayLotes = await loadWorkbook(stream, numGroups);
//   return arrayLotes.reduce((a, b) => a.concat(b), []);
// };

// const loadWorkbook = async (stream, numGroups = 200) => {
//   return new Promise(async (resolve, reject) => {
//     try {
//       const arrayLotes = [];
//       const workbook = new Excel.Workbook();
//       await workbook.xlsx.read(stream).then(async (workbook) => {
//         const titles = workbook.model.sheets[0].rows.shift();
//         const lotes = chunkArrayInGroups(workbook.model.sheets[0].rows, numGroups);
//         try {
//           for (const [i, lote] of lotes.entries()) {
//             const lotePromesas = await createPromise(titles, lote, i);
//             const resultsPromises = await Promise.all(lotePromesas);
//             arrayLotes.push(resultsPromises);
//           }
//           resolve(arrayLotes);
//         } catch (error) {
//           console.error('error en insercion de lotes', error);
//         }
//       });
//     } catch (error) {
//       console.log(error);
//     }
//   });
// };

const getJSON = (head, row, i) => {
  try {
    const rowData = {};
    let emptyValuesCounter = 0;
    // recorro toda la columna
    row.cells.forEach((cell, j) => {
      rowData[head.cells[j].value] = cell.value;
      if (rowData[head.cells[j].value] == undefined) {
        emptyValuesCounter ++;
      }
    });
    return Object.keys(rowData).length != emptyValuesCounter && rowData['Imagen '] ? rowData : null;
  } catch (error) {
    console.log(error);
  }
};



