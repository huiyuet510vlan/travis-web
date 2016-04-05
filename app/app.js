import Ember from 'ember';
import Resolver from './resolver';
import loadInitializers from 'ember-load-initializers';
import config from './config/environment';

Ember.MODEL_FACTORY_INJECTIONS = true;

Ember.LinkComponent.reopen({
  attributeBindings: ['alt']
});

var App = Ember.Application.extend(Ember.Evented, {
  LOG_TRANSITIONS: true,
  LOG_TRANSITIONS_INTERNAL: true,
  LOG_ACTIVE_GENERATION: true,
  LOG_MODULE_RESOLVER: true,
  LOG_VIEW_LOOKUPS: true,
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver: Resolver,

  flash(options) {
    return Ember.getOwner(Travis).lookup('controller:flash').loadFlashes([options]);
  },

  toggleSidebar() {
    var element;
    $('body').toggleClass('maximized');
    element = $('<span></span>');
    $('#top .profile').append(element);
    Ember.run.later((function() {
      return element.remove();
    }), 10);
    element = $('<span></span>');
    $('#repo').append(element);
    return Ember.run.later((function() {
      return element.remove();
    }), 10);
  },

  ready() {
    if (location.hash.slice(0, 2) === '#!') {
      location.href = location.href.replace('#!/', '');
    }
    this.on('user:signed_in', function(user) {
      return Travis.onUserUpdate(user);
    });
    this.on('user:refreshed', function(user) {
      return Travis.onUserUpdate(user);
    });
    this.on('user:synced', function(user) {
      return Travis.onUserUpdate(user);
    });
    return this.on('user:signed_out', function() {
      if (config.userlike) {
        return Travis.removeUserlike();
      }
    });
  },

  currentDate() {
    return new Date();
  },

  onUserUpdate(user) {
    if (config.pro) {
      this.identifyCustomer(user);
    }
    if (config.beacon) {
      this.setupHsBeacon();
    }
    return this.subscribePusher(user);
  },

  subscribePusher(user) {
    var channels;
    if (!user.channels) {
      return;
    }
    channels = user.channels;
    if (config.pro) {
      channels = channels.map(function(channel) {
        if (channel.match(/^private-/)) {
          return channel;
        } else {
          return "private-" + channel;
        }
      });
    }
    return Travis.pusher.subscribeAll(channels);
  },

  setupHsBeacon() {
    if (!document.getElementById('beacon-script')) {
      let s = document.createElement('script');
      s.id = 'beacon-script';
      let code = '!function(e,o,n){window.HSCW=o,window.HS=n,n.beacon=n.beacon||{};var t=n.beacon;t.userConfig={},t.readyQueue=[],t.config=function(e){this.userConfig=e},t.ready=function(e){this.readyQueue.push(e)},o.config={docs:{enabled:!1,baseUrl:""},contact:{enabled:!0,formId:"f48f821c-fb20-11e5-a329-0ee2467769ff"}};var r=e.getElementsByTagName("script")[0],c=e.createElement("script");c.type="text/javascript",c.async=!0,c.src="https://djtflbt20bdde.cloudfront.net/",r.parentNode.insertBefore(c,r)}(document,window.HSCW||{},window.HS||{});';
      try {
        s.appendChild(document.createTextNode(code));        
      } catch (e) {
        s.text = code;
      }
      return document.body.appendChild(s);
    }
  },

  identifyCustomer(user) {
    if (_cio && _cio.identify) {
      return _cio.identify({
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: (Date.parse(user.created_at) / 1000) || null,
        login: user.login
      });
    }
  }
});

loadInitializers(App, config.modulePrefix);

export default App;
