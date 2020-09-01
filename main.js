var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

//settings
var timeout = 5;
var max_history = 15;
var _PORT_ = 3000;
//variable
var chat_history = []
var login_user = []
var keep_alive = []
var action = []
var action_help = []


app.get('/', (req, res) => {
    res.sendFile(__dirname + '/view/app.html');
});




io.on('connection', function(socket) {
    io.emit('sync_message', chat_history);
    console.log("Sending message history")
    socket.on('chat message', function(msg) {
              io.emit('chat message', msg);

        if(JSON.parse(msg).data.startsWith("/")){
          if(action_help[JSON.parse(msg).data.substring(1)]){
            action[JSON.parse(msg).data.substring(1)](JSON.parse(msg).user, JSON.parse(msg).img)
          }
        }
        push_history(msg)
    });

    socket.on('sync_user', function(msg) {
        console.log("User join")
        var ses = JSON.parse(msg).session
        login_user[ses] = [JSON.parse(msg).user, JSON.parse(msg).img]
        io.emit('chat message', JSON.stringify({
            user: "Axti-Bot",
            img: "https://api.adorable.io/avatars/285/axti",
            data: login_user[ses][0] + ' s\'est connecté(é) '
        }));
    });




    socket.on('keep_alive', function(msg) {
        var ses = JSON.parse(msg).session
        keep_alive[ses] = [JSON.parse(msg).session, JSON.parse(msg).timestamp]
        for (var item in keep_alive) {
            if (keep_alive[item][0] == ses) {
            } else {
                if (keep_alive[item][1] + (timeout * 1000) < Date.now()) {
                    console.log("User Disconnect")
                    io.emit('on_disconnect', JSON.stringify({
                        session: item,
                        user: login_user[item][0]
                    }));
                    io.emit('chat message', JSON.stringify({
                        user: "Axti-Bot",
                        img: "https://api.adorable.io/avatars/285/axti",
                        data: login_user[item][0] + ' s\'est déconnecté(é) '
                    }));

                    delete login_user[item]
                    delete keep_alive[item]


                }
            }

        }
        io.emit('sync_user', JSON.stringify({
            session: ses,
            user: login_user[ses][0],
            img: login_user[ses][1]
        }));
        });




});

function push_history(data) {
    if (chat_history.length == max_history) {
        chat_history.shift();
    }
    chat_history.push(data)
}

//HELP COMMAND
action['help'] = function(user, img){
  var item_help='';
for (var item in action_help) {
   var item_help =  item_help +`
    <tr>
      <td>`+action_help[item][0]+`</td>
      <td>`+action_help[item][1]+`</td>
    </tr>
    `
}
io.emit('chat message', JSON.stringify({
    user: "Axti-Bot",
    img: "https://api.adorable.io/avatars/285/axti",
    data:  `
    <table class="table" style="color:#FFF">
  <thead>
    <tr>
      <th scope="col">Name</th>
      <th scope="col">Action</th>
    </tr>
  </thead>
  <tbody id="help_body">
`+item_help+`

  </tbody>
</table>`
}));
}
register_command('help','Command list')
//END



//PING PONG 
action['ping'] = function(user, img){
io.emit('chat message', JSON.stringify({
    user: "Axti-Bot",
    img: "https://api.adorable.io/avatars/285/axti",
    data:  `pong !`
}));
}
register_command('ping','pong !')
//END




function register_command(name, help){
  action_help[name] = [name,help]
}
console.log(action_help)

http.listen(_PORT_, () => {
    console.log('Axti App listening at localhost:'+_PORT_);
    
});