Projects = new Meteor.Collection('projects');
LightInfo = new Meteor.Collection('lightinfo');
HiddenValues = new Meteor.Collection('hiddenvalues');

if (Meteor.isClient) {
  Session.setDefault('curPage', 'selectProject'); //current page - project/input etc
  Session.setDefault('selectedProject', ''); //Project selected in project page
  Session.setDefault('curProject', '');      //Project being worked on
  Session.setDefault('selectedEditInput', ''); //Item selected for editing on Input page
  Session.setDefault('selectedEditInfo', ''); //Item selected for editing on Light Info page

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
  };
  Template.inputData.selectedEdit = function () {
    if (Session.equals('selectedEditInput', this.index)) {
      return 'selectedEdit';
    }
  };
  Template.inputData.editing = function () {
    return Session.get('selectedEditInput');
  };
  Template.inputData.events({
    'change #addLightType' : function () {
      var type = $('#addLightType').val();
      var newType = LightInfo.findOne({type: type}).newType;
      $('#addLightNew').val(newType);
    },
    'change #addLightNew' : function () {
      var newType = $('#addLightNew').val();
      var type = LightInfo.findOne({newType: newType}).type;
      $('#addLightType').val(type);
    },
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
        if (Session.get('selectedEditInput')) {
          Meteor.call('dbProjectsEditLight', this.code, Session.get('selectedEditInput'),
                                            location, type, qty, hours, 
                                            tube, aircon, sensor, newType);
          Session.set('selectedEditInput', '');
        } else {
          Meteor.call('dbProjectsAddLight', this.code, location, type, qty, hours, 
                                            tube, aircon, sensor, newType);
        }
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
      Meteor.call('dbProjectsRemoveLight', Session.get('curProject'), this.index);
    },
    'click .editLightBtn' : function () {
      Session.set('selectedEditInput', this.index);
      $('#addLightLocation').val(this.location);
      $('#addLightType').val(this.type);
      $('#addLightQty').val(this.qty);
      $('#addLightHours').val(this.hours);
      $('#addLightTube').val(this.tube);
      $('#addLightAircon').val(this.aircon);
      $('#addLightSensor').val(this.sensor);
      $('#addLightNew').val(this.newType);
    },
    'click .cancelEditLightBtn' : function () {
      Session.set('selectedEditInput', '');
      $('#addLightLocation').val('');
      $('#addLightType').val('');
      $('#addLightQty').val('');
      $('#addLightHours').val('');
      $('#addLightTube').val('');
      $('#addLightAircon').val('');
      $('#addLightSensor').val('');
      $('#addLightNew').val('');
    }
  });
  
  Template.viewReport.curProject = function () {
    return Projects.findOne({code: Session.get('curProject')});
  };
  Template.viewReport.calculatedStats = function () {
    var values = HiddenValues.findOne({});
    var elecSaving = 0;
    var projCost = 0;
    var escDiscount = 0;
    var netCost = 0;
    this.lightList.forEach (function (curLight) {
      curLightInfo = LightInfo.findOne({type: curLight.type});
      console.log("Finding type in LightInfo: "+curLight.type);
      projCost += curLight.qty * curLightInfo.price;
      projCost += curLight.qty * values.labourCost;
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
  Template.lightInfo.selectedEdit = function () {
    if (Session.equals('selectedEditInfo', this.type)) {
      return 'selectedEdit';
    }
  };
  Template.lightInfo.editing = function () {
    return Session.get('selectedEditInfo');
  };
  Template.lightInfo.events({
    'click #addLightInfoBtn' : function () {
      var type = $('#addLightInfoType').val();
      var newType = $('#addLightInfoNew').val();
      var description = $('#addLightInfoDescription').val();
      var price = $('#addLightInfoPrice').val();
      var watts = $('#addLightInfoWatts').val();
      
      //window.alert(type+newType+description+price+watts);

      var legal = true;
      var errors = "";
      var intRegex = /^\d+$/;
      var floatRegex = /^[0-9]+(?:\.[0-9]+)?$/;
      var lightInfo = LightInfo.find();
      
      if (type === "") {
        errors += "Type cannot be empty\n";
        legal = false;
      }
      if (newType === "") {
        errors += "New type cannot be empty\n";
        legal = false;
      }
      // Make sure type and newType don't conflict with existing entires
      LightInfo.find().forEach (function (curLight) {
        console.log("Comparing "+type+" and "+curLight.type);
        if (type == curLight.type) {
          errors += "Cannot have two entries of same type "+type+"\n";
          legal = false;
        }
        if (newType == curLight.newType) {
          errors += "Cannot have two entries of same newType "+newType+"\n";
          legal = false;
        }
      });
      if (description === "") {
        errors += "Description cannot be empty\n";
        legal = false;
      }
      if (!floatRegex.test(price)) {
        errors += "Price must be a positive decimal\n";
        legal = false;
      }
      if (!intRegex.test(watts)) {
        errors += "Watts must be a positive integer\n";
        legal = false;
      }
      
      if (legal) {
        if (Session.get('selectedEditInfo')) {
          Meteor.call('dbLightInfoEdit', Session.get('selectedEditInfo'),
                                         description, price, watts);
          Session.set('selectedEditInfo', '');
        } else {
          Meteor.call('dbLightInfoAdd', type, newType, description, price, watts);
        }
        $('#addLightInfoType').val('');
        $('#addLightInfoNew').val('');
        $('#addLightInfoDescription').val('');
        $('#addLightInfoPrice').val('');
        $('#addLightInfoWatts').val('');
      } else {
        window.alert(errors);
      }
    },
    'click .removeLightInfoBtn' : function () {
      Meteor.call('dbLightInfoRemove', this.type);
    },
    'click .editLightInfoBtn' : function () {
      Session.set('selectedEditInfo', this.type);
      $('#addLightInfoType').val(this.type);
      $('#addLightInfoNew').val(this.newType);
      $('#addLightInfoDescription').val(this.description);
      $('#addLightInfoPrice').val(this.price);
      $('#addLightInfoWatts').val(this.watts);
    },
    'click .cancelEditLightInfoBtn' : function () {
      Session.set('selectedEditInfo', '');
      $('#addLightInfoType').val('');
      $('#addLightInfoNew').val('');
      $('#addLightInfoDescription').val('');
      $('#addLightInfoPrice').val('');
      $('#addLightInfoWatts').val('');
    }
  });

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
      dbProjectsEditLight: function (code, index, location, type, qty, hours, tube, aircon, sensor, newType) {
        Projects.update({code: code, "lightList.index": index},
                        {$set: {"lightList.$.location": location,
                                "lightList.$.type": type,
                                "lightList.$.qty": qty,
                                "lightList.$.hours": hours,
                                "lightList.$.tube": tube,
                                "lightList.$.aircon": aircon,
                                "lightList.$.sensor": sensor,
                                "lightList.$.newType": newType}});
      },
      dbProjectsRemoveLight: function (code, index) {
        Projects.update({code: code}, {$pull: {lightList: {index: index}}});
      },

      dbLightInfoAdd: function (type, newType, description, price, watts) {
        LightInfo.insert({type: type,
                          newType: newType,
                          description: description,
                          price: price,
                          watts: watts});
      },
      dbLightInfoEdit: function (type, description, price, watts) {
        LightInfo.update({type: type},
                        {$set: {description: description,
                                price: price,
                                watts: watts}});
      },
      dbLightInfoRemove: function (type) {
        LightInfo.remove({type: type});
      }
    });
  });
}
