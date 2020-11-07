const ExcelJS = require('exceljs');
const fs = require('fs');
const shell = require('child_process').execSync ; 

const procedure = async () => {
  try {

    const activitie = false;
    const jsonData = await getJsonDataFromXlsx()
    // console.log(jsonData);
    

    // leemos el directorio

    if (activitie) {
      shell('rm -rf /home/roberto/Escritorio/script/Imagenes_Modelos_Renamed')
      shell('mkdir /home/roberto/Escritorio/script/Imagenes_Modelos_Renamed')
      fs.readdirSync('./Imagenes_Modelos').forEach((file, i) => {        
        // fs.renameSync(`./Imagenes_Modelos/${file}`, `./Imagenes_Modelos/${jsonData[file]}+.png`);
        const imageKey = file.trim().replace(/\s+/g, '_').toLowerCase()
        console.log(imageKey, file)
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
      const data = fs.readdirSync('./Imagenes_Modelos_Renamed').map((file) => {
        return file
      })
      

      const dataOrder = data.sort((astring,bstring) => {
        const a = parseInt(astring.split('.')[0])
        const b = parseInt(bstring.split('.')[0])
        if(a < b) { return -1; }
        if(a > b) { return 1; }
        return 0;
      })

      fs.appendFile('data.txt', dataOrder.toString().replace(/,/g, '\n'), function (err) {
        if (err) throw err;
        console.log('Saved!');
      });
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
    const imageNameClear = imageSchrondiger.trim().replace(/\s+/g, '_').toLowerCase()
    const image = imageNameClear.match(/\.(jpeg|jpg|gif|png)$/) ? imageNameClear : imageNameClear+'.png'
    // console.log(image)
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
    return Object.keys(rowData).length != emptyValuesCounter && rowData['Imagen '] && rowData['Imagen '] != 'francisco' ? rowData : null;
  } catch (error) {
    console.log(error);
  }
};


procedure();