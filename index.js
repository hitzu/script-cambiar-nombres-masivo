const ExcelJS = require('exceljs');
const procedure = async () => {
  
  const jsonData = await getJsonDataFromXlsx()

}


const getJsonDataFromXlsx = async () => {
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile('./Imagenes_Modelos.xlsx');

  // console.log('data del archivo', workbook.model.sheets[0].rows[0].cells)
  const lotes = chunkArrayInGroups(workbook.model.sheets[0].rows, 200);
  
  let arrayLotes = []
  const titles = workbook.model.sheets[0].rows.shift();

  for (const [i, lote] of lotes.entries()) {
      lotePromesas = await createPromise(titles, lote, i);
      const resultsPromises = await Promise.all(lotePromesas);
      arrayLotes.push(resultsPromises);
  }

  console.log(arrayLotes[0]);

  const arrayComplete = arrayLotes.reduce((previus, current) => previus.concat(current), []).map((element) => {
    const imageSchrondiger = element['Imagen ']
    return {
      id : element.gmd_id,
      image : imageSchrondiger
    }
  })

  console.log(arrayComplete);
}


const createPromise = (titles, subArray, i) => {
  return new Promise( async (resolve) => {
    const objectsArray = [];
    for (const [i, sample] of subArray.entries()){
      const result = getJson(titles, sample)
      if (result) {
        objectsArray.push(result);
      }
    }
    resolve(objectsArray);
  })
}

const getJson = (title, row) => {
  try {
    const rowData = {};

    row.cells.forEach((cell, j) => {
      rowData[title.cells[j].value] = cell.value
    })

    return rowData;
    
  } catch (error) {
    console.log(error);
  }
}


const chunkArrayInGroups = (arr, size) =>{
  const myArray = [];
  // iniciamos la lectura en 1 porque la linea de titulo sigue en el archivo
  for (let i = 1; i < arr.length - 1; i += size) {
      myArray.push(arr.slice(i, i+size));
  }
  return myArray;
};





procedure();