Projects = new Meteor.Collection('projects');
LightInfo = new Meteor.Collection('lightinfo');
HiddenValues = new Meteor.Collection('hiddenvalues');

if (Meteor.isClient) {
  Session.setDefault('curPage', 'selectProject'); //current page - project/input etc
  Session.setDefault('selectedProject', ''); //Project selected in project page
  Session.setDefault('curProject', '');      //Project being worked on

  Template.navbar.isActive = function (page) {
    if (Session.equals('curPage', page)) {
      return 'class=active';
    }
  };
  Template.navbar.curProject = function () {
    if (Session.equals('curProject', '')) {
      return 'None';
    }
    return Session.get('curProject');
  };
  Template.navbar.events({
    'click #navProject' : function () {
      Session.set('curPage', 'selectProject');
    },
    'click #navInput' : function () {
      Session.set('curPage', 'inputData');
    },
    'click #navReport' : function () {
      Session.set('curPage', 'viewReport');
    },
    'click #navAnalysis' : function () {
      Session.set('curPage', 'analysis');
    },
    'click #navLightInfo' : function () {
      Session.set('curPage', 'lightInfo');
    },
    'click #navHiddenValues' : function () {
      Session.set('curPage', 'hiddenValues');
    }
  });

  Template.contentWrapper.curPage = function (page) {
    return Session.equals('curPage', page);
  };

  Template.selectProject.projects = function () {
    var searchTerm = '';
    if (searchTerm) {
      return Projects.find({name: searchTerm});
    }
    return Projects.find({});
  };
  Template.selectProject.events({
    'click #testButton' : function () {
      Meteor.call('dbProjectsDrop');
    },
    'click .projectList' : function () {
      Session.set('selectedProject', this.code);
    },
    'click #confirmProject' : function () {
      Session.set('curProject', Session.get('selectedProject'));
      Session.set('curPage', 'inputData');
    }
  });

  Template.inputData.curProject = function () {
    return Projects.findOne({code: Session.get('curProject')});
  };
  Template.inputData.lightList = function () {
    var projectDetails = Projects.findOne({code: this.code});
    return projectDetails.lightList;
  };
  Template.inputData.lightType = function () {
    return LightInfo.find();
  }
  Template.inputData.events({
    'click #addLightBtn' : function () {
      var location = $('#addLightLocation').val();
      var type = $('#addLightType').val();
      var qty = $('#addLightQty').val();
      var hours = $('#addLightHours').val();
      var tube = $('#addLightTube').val();
      var aircon = $('#addLightAircon').val();
      var sensor = $('#addLightSensor').val();
      var newType = $('#addLightNew').val();
      //window.alert(location+type+qty+hours+tube+aircon+sensor+newType);

      var legal = true;
      var errors = "";
      var intRegex = /^\d+$/;
      if (type === "") {
        errors += "Type cannot be empty\n";
        legal = false;
      }
      if (!intRegex.test(qty)) {
        errors += "Quantity must be a positive integer\n";
        legal = false;
      }
      if (intRegex.test(hours)) {
        if (parseInt(hours, 10) > 8760) {
          errors += "Hours must not exceed 8760\n";
          legal = false;
        }
      } else {
        errors += "Hours must be an integer between 0-8760\n";
        legal = false;
      }
      if (tube === "") {
        errors += "Tube type cannot be empty\n";
        legal = false;
      }
      if (newType === "") {
        errors += "New type cannot be empty\n";
        legal = false;
      }
      if (legal) {
        Meteor.call('dbProjectsAddLight', this.code, location, type, qty, hours, 
                                          tube, aircon, sensor, newType);
        $('#addLightLocation').val('');
        $('#addLightType').val('');
        $('#addLightQty').val('');
        $('#addLightHours').val('');
        $('#addLightTube').val('');
        $('#addLightAircon').val('');
        $('#addLightSensor').val('');
        $('#addLightNew').val('');
      } else {
        window.alert(errors);
      }
    },
    'click .removeLightBtn' : function () {
      console.log("Trying to remove light with index: "+this.index);
      Meteor.call('dbProjectsRemoveLight', Session.get('curProject'), this.index);
    }
  });
  
  Template.viewReport.curProject = function () {
    return Projects.findOne({code: Session.get('curProject')});
  };
  Template.viewReport.calculatedStats = function () {
    var elecSaving = 0;
    var projCost = 0;
    var escDiscount = 0;
    var netCost = 0;
    this.lightList.forEach (function (curLight) {
      curLightInfo = LightInfo.findOne({type: curLight.type});
      console.log("Finding type in LightInfo: "+curLight.type);
      projCost += curLight.qty * curLightInfo.price;
      projCost += curLight.qty * 45;
      netCost += curLight.qty * curLightInfo.price;
    });

    return {elecSaving: elecSaving,
            projCost: projCost,
            escDiscount: escDiscount,
            netCost: netCost};
  };

  Template.lightInfo.lights = function () {
    return LightInfo.find();
  };

  Template.hiddenValues.values = function() {
    return HiddenValues.findOne({});
  };
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
    if (Projects.find().count() === 0) {
      Projects.insert({code: 'GB0001', address: '30 Felton Rd Carlingford', lightList: []});
      Projects.insert({code: 'GB0002', address: '52 Holker St Silverwater', lightList: []});
      Projects.insert({code: 'GB0003', address: 'some address', lightList: []});
      Projects.insert({code: 'GB0004', address: 'al;skdfj;iosafjaw;lfj;sdio', lightList: []});
    }
    if (LightInfo.find().count() === 0) {
      LightInfo.insert({type: 'EM236', price: '100.80', newType: 'EM36LED'});
      LightInfo.insert({type: 'EM218', price: '100.80', newType: 'EM18LED'});
      LightInfo.insert({type: '132', price: '100.80', newType: 'R15LED'});
    }
    if (HiddenValues.find().count() === 0) {
      HiddenValues.insert({escPrice: 22.5, elecPrice: 22.5, labourCost: 45, sensorPrice: 50});
    }

    Meteor.methods({
      dbProjectsDrop: function () {
        Projects.remove({});
      },
      dbProjectsAdd: function (code) {
        //TODO
      },
      dbProjectsAddLight: function (code, location, type, qty, hours, tube, aircon, sensor, newType) {
        var index = Math.floor((Math.random()*1000)+1)
        Projects.update({code: code},
                         {$push: {lightList: {index: index,
                                              location: location,
                                              type: type,
                                              qty: qty,
                                              hours: hours,
                                              tube: tube,
                                              aircon: aircon,
                                              sensor: sensor,
                                              newType: newType}}});
      },
      dbProjectsRemoveLight: function (code, index) {
        Projects.update({code: code}, {$pull: {lightList: {index: index}}});
      }
    });
  });
}
