const express = require('express')
const app = express()
const https = require('node:https')
const fs = require('node:fs')
const options = {
    key: fs.readFileSync('private-key.pem'),
    cert: fs.readFileSync('certificate.pem'),
  }
const server = https.createServer(options,app)
const multer = require('multer')
const upload = multer({ dest: 'save' })
function headerhelper(res) {
    res.setHeader('Cross-Origin-Opener-Policy','same-origin')
    res.setHeader('Cross-Origin-Embedder-Policy','require-corp')
}
function getname(filename) {
    extensionLength = filename.length - filename.lastIndexOf('.');
    result = filename.substring(0, filename.length - extensionLength)
    return result
}
app.get('/',function(req,res) {
    files = fs.readdirSync('library')
    tablecontent = '<thead><tr><th></th><th></th></tr></thead><tbody>'
    for(i in files) {
        aname = getname(files[i])
        tablecontent = tablecontent + `<tr><td>${aname}</td><td><a class='mdui-btn mdui-color-yellow' href="/game?name=${files[i]}" >开始游戏</a></td></tr>`
    }
    tablecontent = tablecontent + '</tbody>'
    index = `<!doctype html>
<html lang="zh-cn">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, shrink-to-fit=no">
    <meta name="renderer" content="webkit">
    <link rel="stylesheet" href="mdui/css/mdui.min.css">
    <title>CrossUME</title>
  </head>
  <body class="mdui-appbar-with-toolbar">
    <div class="mdui-appbar mdui-appbar-fixed">
        <div class="mdui-toolbar mdui-color-orange">
          <a href="javascript:;" class="mdui-typo-title">CrossUME</a>
        </div>
      </div>
    </div>
    <div class='mdui-container'>
      <div class="mdui-table-fluid">
        <table class="mdui-table">${tablecontent}</table>
      </div>
    </div>  
    <!-- MDUI JavaScript -->
    <script src="mdui/js/mdui.min.js"></script>
 </html>`
    headerhelper(res)
    res.send(index)
})
app.get('/game',function (req,res) {
    headerhelper(res)
    if(fs.existsSync('save/' + req.query.name + '.save')) {
       savecontent = `EJS_loadStateURL = '/save/' + '${req.query.name}' + '.save'`
    } else {
        savecontent = ''
    }
    gamepage = `<!doctype html>
<html>
        <head>
        <title>EmulatorJS</title>
        <link rel = icon href = docs/favicon.ico sizes = "16x16 32x32 48x48 64x64" type = image/vnd.microsoft.icon>
        <meta name = viewport content = "width = device-width, initial-scale = 1">
        <style>
             body, html {
                height: 100%;
                background-color: black;
                color: white;
            }                                                   

            body {
                margin: 0;
                overflow: hidden;
            }

            body, #box, #top {
                display: flex;
                align-items: center;
                justify-content: center;
                flex-direction: column;
            }

            #box {
                color: #aaa;
                height: 20em;
                width: 30em;
                max-width: 80%;
                max-height: 80%;
                background-color: #333;
                border-radius: 0.4em;
                border: 2px solid #555;
                position: relative;
                flex-direction: column;
                transition-duration: 0.2s;
                overflow: hidden;
                font-family: monospace;
                font-weight: bold;
                font-size: 20px;
                margin: 5px;
            }

            #box:hover, #box[drag] {
                border-color: #38f;
                color: #ddd
            }

            #input {
                cursor: pointer;
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                opacity: 0
            }

            #display {
                width: 100%;
                height: 100%
            }

            select, button {
                padding: 0.6em 0.4em;
                margin: 0.5em;
                width: 15em;
                max-width: 100%;
                font-family: monospace;
                font-weight: bold;
                font-size: 16px;
                background-color: #444;
                color: #aaa;
                border-radius: 0.4em;
                border: 1px solid #555;
                cursor: pointer;
                transition-duration: 0.2s
            }

            select:hover, button:hover {
                background-color: #666;
                color: #ddd
            }

            .logo {
                width: 130px;
                height: 130px;
                filter: drop-shadow(0 0 10px white);
            }

            #top {
                margin: 5px;
            }
        </style>
    </head>
    <body>
        <div  id="main" style="width: 100%;height: 100%">
            <div id="game"></div>
        </div>
        <script> 
            EJS_player = "#game"
            EJS_core = "desmume2015"
            EJS_pathtodata = "/ejs/data/"
            EJS_gameUrl = '/games/' + '${req.query.name}'
            EJS_startOnLoaded = true
            EJS_threads = true
            ${savecontent}
            EJS_onSaveState = function (save) {
                saveblob = new Blob([save.state])
                savefile = new File([save.state], '${req.query.name}' + '.save')
                const form = new FormData()
                form.append('file', savefile)
                xhr = new XMLHttpRequest()
                xhr.open('POST','/upload?name=${req.query.name}')
                xhr.send(form)
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        alert('存档完成！')
                    }
                }
            }
        </script>
        <script src="/ejs/data/loader.js"></script>
    </body>
</html>`
    res.send(gamepage)
})
app.post('/upload', upload.single('file'), (req, res) => {
    fname = req.query.name + '.save'
    //console.log(req.file)
    fs.unlink('save/' + fname + '.bak' , function (e){ console.log(e) })
    fs.rename('save/' + fname,'save/' + fname + '.bak', function (e){ console.log(e) })
    fs.rename('save/' + req.file.filename,'save/' + fname, function (e){ console.log(e) })
    res.setHeader('Content-Type', 'text/html')
    res.end('上传成功')
  })
app.use('/ejs',express.static('emulator-js',{setHeaders: headerhelper}))
app.use('/mdui',express.static('mdui'))
app.use('/games',express.static('library'))
app.use('/save',express.static('save'))
if(process.argv[2]) {
    port = process.argv[2]
} else {
    port = 8030
}
console.log(`浏览器访问\"http://本机IP:${port}\"来使用本程序`)
server.listen(port)