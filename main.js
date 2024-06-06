
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

app.set("view engine", "ejs");


function getflaskcode(model_path , label ) {
 req = ""
 pr = ""
 pred = ""
 for (let i =0 ; i<label.length ; i++){
  if(label[i] == "File"){
    req = req + "\n" + `    ${label[i]}= request.files.get('${label[i]}')`
    pr = pr + "\n" +`    print(${label[i]})`
    pred = pred + `${label[i]}` + ","
  }
  else{
    req = req + "\n" + `    ${label[i]}= request.form.get('${label[i]}')`
    pr = pr + "\n" +`    print(${label[i]})`
    pred = pred + `${label[i]}` + ","
  }
 }


  return `
from flask import Flask, render_template, request
import joblib

app = Flask(__name__)


@app.route('/', methods=['GET', 'POST'])
def index():
  prediction = ""
  if request.method == "POST":
    ${req}
    model = joblib.load("${model_path}")
    ${pr}
    ans = model.predict([[${pred}]])
    prediction = f'The Value of ${OUTPUT} is {ans}'

    return render_template('index.html' , prediction = prediction)

  return render_template('index.html' , prediction = prediction)

if __name__ == "__main__":
  app.run(debug=True)
`;
}


function generate_form(label_list , type_list){
  form = ""
  for(let i=0 ; i<label_list.length ; i++){
    form = form +"\n"+
`
<div class="relative z-0 w-full mb-5 group">
<input type="${type_list[i]}" name="${label_list[i]}" id="${label_list[i]}" class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer" placeholder=" " required />
<label class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">${label_list[i]}</label>
</div>
`
  }

final = 
  `
<form class="max-w-md mx-auto border p-6 " method="post">
${form}
<button type="submit" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Submit</button>
</form>
`

return final

}



let PROJECT_NAME = ""
let ML_FILE = null
let FEATURE_LABEL_LIST = [];
let FEATURE_TYPE_LIST = [];
let OUTPUT = ""
let OUTPUT_TYPE =""
let COMPONENTS =[]
let THEME




const uploadDir = path.join(__dirname, `uploads`);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');  
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);  
  }
});



const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));






app.get('/', (req, res) => {
  res.render("index");
});

app.get('/step1', (req, res) => {
  res.render("step1");
});

app.get('/step2', (req, res) => {
  res.render("step2");
});

app.get('/step3', (req, res) => {
  res.render("step3");
});

app.get('/step4', (req, res) => {
  res.render("step4");
});

app.get('/step5', (req, res) => {
  res.render("step5" , {PROJECT_NAME , ML_FILE, FEATURE_LABEL_LIST , FEATURE_TYPE_LIST, OUTPUT , OUTPUT_TYPE , COMPONENTS , THEME});
});


app.get('/generate', (req, res) => {


  if (fs.existsSync(`GENERATED_PROJECTS/${PROJECT_NAME}`)) {
    console.log("exist")
  }
  else{
    fs.mkdirSync(`GENERATED_PROJECTS/${PROJECT_NAME}`)
  }
  if (fs.existsSync(`GENERATED_PROJECTS/${PROJECT_NAME}/templates`)) {
    console.log("exist2")
  }
  else{
    fs.mkdirSync(`GENERATED_PROJECTS/${PROJECT_NAME}/templates`)
  }

 

  fs.writeFile(`GENERATED_PROJECTS/${PROJECT_NAME}/main.py`, getflaskcode(`${ML_FILE.filename}`, FEATURE_LABEL_LIST), function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('The file was created successfully.');
    }
  });

  let starter = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Document</title>
      <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body> 
  ${generate_form(FEATURE_LABEL_LIST , FEATURE_TYPE_LIST)}

  <div>
  <p class="text-center">{{prediction}}</p>
</div>
  </body>
  </html>
  `


  fs.writeFile(`GENERATED_PROJECTS/${PROJECT_NAME}/templates/index.html`, starter, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log('The file was created successfully.');
    }
  });

  fs.copyFile(`uploads/${ML_FILE.filename}`, `GENERATED_PROJECTS/${PROJECT_NAME}/${ML_FILE.filename}` , (err) => {
    if (err) {
        console.error('Error occurred while copying the file:', err);
    } else {
        console.log('File copied successfully to', destinationPath);
    }
});
  
  

  res.render("generate");
});


app.post('/step1', upload.single('ML-FILE'), (req, res) => {
  PROJECT_NAME = req.body["PROJECT-NAME"];
  ML_FILE = req.file;

  console.log(ML_FILE)
  res.redirect('/step2');
});

app.post('/step2',  (req, res) => {
  

  n = req.body["NUM-FEATURE"];

  for(let i=0 ; i<n ; i++){
    FEATURE_LABEL_LIST.push(req.body[`FEATURE-${i+1}`])
    FEATURE_TYPE_LIST.push(req.body[`RADIO-${i+1}`])
  }
  
  console.log(FEATURE_LABEL_LIST)
  console.log(FEATURE_TYPE_LIST)

  res.redirect('/step3');
});

app.post('/step3',  (req, res) => {
  OUTPUT = req.body["OUTPUT"]
  OUTPUT_TYPE = req.body['OUTPUT-TYPE']
  console.log(OUTPUT)
  console.log(OUTPUT_TYPE)

  res.redirect('/step4');
});

app.post('/step4',  (req, res) => {
  COMPONENTS = req.body.features;
  THEME = req.body['theme']

  res.redirect('/step5');
});




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});




