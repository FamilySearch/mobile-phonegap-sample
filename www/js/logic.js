// ====================================
// PhoneGap App init and event handlers
// ====================================
var app = {
  // Application Constructor
  initialize: function() {
    this.bindEvents();
  },
  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },
  // deviceready Event Handler
  //
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicitly call 'app.receivedEvent(...);'
  onDeviceReady: function() {
    app.receivedEvent('deviceready');
  },
  // Update DOM on a Received Event
  receivedEvent: function(id) {
    var parentElement = document.getElementById(id);
    var listeningElement = parentElement.querySelector('.listening');
    var receivedElement = parentElement.querySelector('.received');
    listeningElement.setAttribute('style', 'display:none;');
    receivedElement.setAttribute('style', 'display:block;');
    console.log('Received Event: ' + id);
  }
};

// =========
// App Logic
// =========
var myApp = new Framework7();
var $$ = Dom7;
var domain = "https://familysearch.org";
var ident = "https://ident.familysearch.org";
var client_id = "";
var access_token = null;
var user = null;

// Add view
var mainView = myApp.addView('.view-main', { dynamicNavbar: true });

// Home Page
myApp.onPageInit('home', function (page) {
});

// Person Page
myApp.onPageInit('person', function (page) {
  $$.ajax({
    url: domain+'/platform/tree/persons/'+page.query.pid,
    headers: { Accept: 'application/json', Authorization: 'Bearer '+access_token },
    statusCode: {
      200: function (xhr) {
        var person = JSON.parse(xhr.response);
        console.log(person.persons[0].display.name);
        $$('.personPortrait').attr({ src: domain+'/platform/tree/persons/'+person.persons[0].id+'/portrait?access_token='+access_token+'&default=http://fsicons.org/wp-content/uploads/2014/10/gender-unknown-circle-2XL.png'} );
        $$('.personName').append(person.persons[0].display.name);
        $$('.personBirth').append(person.persons[0].display.birthDate);
        $$('.personDeath').append(person.persons[0].display.deathDate);
      }
    }
  });
});

// Tree Page
myApp.onPageInit('tree', function (page) {
  $$.ajax({
    url: domain+"/platform/tree/ancestry?person="+user.personId+"&generations=4",
    headers: { Accept: 'application/json', Authorization: 'Bearer '+access_token },
    statusCode: {
      200: function (xhr) {
        user.tree = JSON.parse(xhr.response).persons;
        console.log("Tree Length: "+user.tree.length);
        for (var i=0; i<user.tree.length; i++) {
          $$('.tree').append(
            '<li class="contact-item">'+
            '<a href="person.html?pid='+user.tree[i].id+'" class="item-link">'+
            '  <div class="item-content">'+
            '    <div class="item-media"><img class="treePersonThumb" src="'+domain+'/platform/tree/persons/'+user.tree[i].id+'/portrait?access_token='+access_token+'&default=http://fsicons.org/wp-content/uploads/2014/10/gender-unknown-circle-2XL.png"></div>'+
            '    <div class="item-inner">'+
            '      <div class="item-title-row">'+
            '        <div class="item-title">'+user.tree[i].display.name+'</div>'+
            '      </div>'+
            '      <div class="item-subtitle">'+user.tree[i].display.lifespan+'</div>'+
            '    </div>'+
            '  </div>'+
            '</a>'+
            '</li>'
          );
        }
      }
    }
  });
});

// Memories Page
myApp.onPageInit('memories', function (page) {
  $$.ajax({
    url: domain+"/platform/memories/users/"+user.id+"/memories",
    headers: { Accept: 'application/json', Authorization: 'Bearer '+access_token },
    statusCode: {
      200: function (xhr) {
        user.memories = JSON.parse(xhr.response).sourceDescriptions;
        for (var i=0; i<40; i++) {
          // Only look at jpegs
          if (user.memories[i].mediaType == "image/jpeg") {
            $$('.memories').append('<div><img src="'+user.memories[i].links['image-thumbnail'].href+'"></div>');
          }
        }
      }
    }
  });
});

// Login
$$('.loginButton').on('click', function () {
  var creds = {
    username: $$('.username').val(),
    password: $$('.password').val(),
    grant_type: "password",
    client_id: client_id
  };

  // Authenticate User
  $$.post(ident+'/cis-web/oauth2/v3/token', creds, function(rsp) {
    access_token = JSON.parse(rsp).access_token;
    console.log(access_token);

    // Get logged in user info
    $$.ajax({
      url: domain+'/platform/users/current',
      headers: { Accept: 'application/json', Authorization: 'Bearer '+access_token },
      statusCode: {
        200: function (xhr) {
          user = JSON.parse(xhr.response).users[0];
          $$('.treeNavLink').click();
          console.log(user.displayName);
        }
      }
    });
  });
});