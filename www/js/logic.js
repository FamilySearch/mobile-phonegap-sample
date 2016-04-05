// ====================================
// PhoneGap App init and event handlers
// ====================================
var app = {
  // Application Constructor
  initialize: function() {
    this.bindEvents();
  },
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function() {
    document.addEventListener('deviceready', this.onDeviceReady, false);
  },
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicitly call 'app.receivedEvent(...);'
  onDeviceReady: function() {
    console.log("App Ready");
  },
};

// =========
// App Logic
// =========
var myApp = new Framework7();
var $$ = Dom7;
var client_id = "ENTER_APP_KEY_HERE";
var access_token = null;
var auth_url = null;
var current_user = null;
var current_person = null;
var user = null;

// Add view
var mainView = myApp.addView('.view-main', { dynamicNavbar: true });

// Get FamilySearch API endpoints via the Discovery Service
$$.ajax({
  url: 'https://familysearch.org/platform/collection',
  headers: { Accept: 'application/json' },
  statusCode: {
    200: function (xhr) {
      rsp = JSON.parse(xhr.response);
      auth_url = rsp.collections[0].links['http://oauth.net/core/2.0/endpoint/token'].href;
      current_user = rsp.collections[0].links['current-user'].href;

      // Get Tree collection to get Current Tree Person
      $$.ajax({
        url: rsp.collections[0].links['family-tree'].href,
        headers: { Accept: 'application/json' },
        statusCode: {
          200: function (xhr) {
            rsp = JSON.parse(xhr.response);
            // Get Ancestry endpoint and remove template
            current_person = rsp.collections[0].links['ancestry-query'].template.split('{')[0];
          }
        }
      });  
    }
  }
});  

// Person Page
myApp.onPageInit('person', function (page) {
  $$.ajax({
    url: page.query.url,
    headers: { Accept: 'application/json', Authorization: 'Bearer '+access_token },
    statusCode: {
      200: function (xhr) {
        var person = JSON.parse(xhr.response);
        console.log(person.persons[0].display.name);
        $$('.personPortrait').attr({ src: page.query.url+'/portrait?access_token='+access_token+'&default=http://fsicons.org/wp-content/uploads/2014/10/gender-unknown-circle-2XL.png'} );
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
    url: current_person+"?person="+user.personId+"&generations=4",
    headers: { Accept: 'application/json', Authorization: 'Bearer '+access_token },
    statusCode: {
      200: function (xhr) {
        user.tree = JSON.parse(xhr.response).persons;
        console.log("Tree Length: "+user.tree.length);
        for (var i=0; i<user.tree.length; i++) {
          // Remove access_toke from href
          href = user.tree[i].links.person.href.split("?")[0];
          $$('.tree').append(
            '<li class="contact-item">'+
            '<a href="person.html?url='+href+'" class="item-link">'+
            '  <div class="item-content">'+
            '    <div class="item-media"><img class="treePersonThumb" src="'+href+'/portrait?access_token='+access_token+'&default=http://fsicons.org/wp-content/uploads/2014/10/gender-unknown-circle-2XL.png"></div>'+
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
    url: user.links.artifacts.href,
    headers: { Accept: 'application/json', Authorization: 'Bearer '+access_token },
    statusCode: {
      200: function (xhr) {
        user.memories = JSON.parse(xhr.response).sourceDescriptions;
        console.log("Memories: "+user.memories.length);
        for (var i=0; i<40; i++) {
          // Get JPGs only
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
  $$.post(auth_url, creds, function(rsp) {
    access_token = JSON.parse(rsp).access_token;
    console.log(access_token);
    
    // Get user PID so we can get tree & memories
    $$.ajax({
      url: current_user,
      headers: { Accept: 'application/json', Authorization: 'Bearer '+access_token },
      statusCode: {
        200: function (xhr) {
          user = JSON.parse(xhr.response).users[0];
          // Go to the tree page after login
          $$('.treeNavLink').click();
          console.log(user.displayName);
        }
      }
    });
  });
});