from flask import Flask , render_template , request
import joblib
app = Flask(__name__)

@app.route('/' , methods=['GET', 'POST'])
def index():
    if request.method =="POST":
        name = request.form.get('name')
        model = joblib.load('FlaskTemplateCode\mum.pkl')
        a = model.predict([[2,3]])
        print(model)
        print(name)
    return render_template('index.html')

if __name__ =="__main__":
    app.run(debug=True)