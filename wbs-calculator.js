Projects = new Meteor.Collection('projects');
LightInfo = new Meteor.Collection('lightinfo');
HiddenValues = new Meteor.Collection('hiddenvalues');

if (Meteor.isClient) {
  Session.setDefault('theme', 'dark'); // dark theme by default
  Session.setDefault('projectSearch', '');
  Session.setDefault('curPage', 'selectProject'); //current page - project/input etc
  Session.setDefault('curProject', '');      //Project being worked on
  Session.setDefault('selectedEditInput', ''); //Item selected for editing on Input page
  Session.setDefault('reportType', 'table');
  Session.setDefault('selectedEditInfo', ''); //Item selected for editing on Light Info page
  Session.setDefault('saveDisabled', true); //Input page, disabled by default

  Template.navbar.theme = function () {
    if (Session.equals('theme', 'dark')) {
      return "navbar-inverse";
    }
  };
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
    'click #logo' : function () {
      if (Session.equals('theme', 'light')) {
        Session.set('theme', 'dark');
      } else if (Session.equals('theme', 'dark')) {
        Session.set('theme', 'light');
      }
    },
    'click #navProject' : function () {
      Session.set('curPage', 'selectProject');
      Session.set('projectSearch', '');
      Session.set('selectedEditInput', '');
      Session.set('reportType', 'table');
      Session.set('selectedEditInfo', '');
      Session.set('saveDisabled', true);
    },
    'click #navInput' : function () {
      Session.set('curPage', 'inputData');
      Session.set('projectSearch', '');
      Session.set('selectedEditInput', '');
      Session.set('reportType', 'table');
      Session.set('selectedEditInfo', '');
      Session.set('saveDisabled', true);
    },
    'click #navReport' : function () {
      Session.set('curPage', 'viewReport');
      Session.set('projectSearch', '');
      Session.set('selectedEditInput', '');
      Session.set('reportType', 'table');
      Session.set('selectedEditInfo', '');
      Session.set('saveDisabled', true);
    },
    'click #navAnalysis' : function () {
      Session.set('curPage', 'analysis');
      Session.set('projectSearch', '');
      Session.set('selectedEditInput', '');
      Session.set('reportType', 'table');
      Session.set('selectedEditInfo', '');
      Session.set('saveDisabled', true);
    },
    'click #navLightInfo' : function () {
      Session.set('curPage', 'lightInfo');
      Session.set('projectSearch', '');
      Session.set('selectedEditInput', '');
      Session.set('reportType', 'table');
      Session.set('selectedEditInfo', '');
      Session.set('saveDisabled', true);
    },
    'click #navHiddenValues' : function () {
      Session.set('curPage', 'hiddenValues');
      Session.set('projectSearch', '');
      Session.set('selectedEditInput', '');
      Session.set('reportType', 'table');
      Session.set('selectedEditInfo', '');
      Session.set('saveDisabled', true);
    }
  });

  Template.contentWrapper.curPage = function (page) {
    return Session.equals('curPage', page);
  };

  Template.selectProject.projects = function () {
    var searchTerm = Session.get('projectSearch');
    if (searchTerm) {
      var results = [];
      Projects.find({code: new RegExp(searchTerm, 'i')}).forEach (function (curProject) {
        results.push({code: curProject.code, address: curProject.address});
      });
      Projects.find({address: new RegExp(searchTerm, 'i')}).forEach (function (curProject) {
        var alreadyAdded = false;
        for (var i = 0; i < results.length; i++) {
          if (results[i].code == curProject.code) {
            alreadyAdded = true;
          }
        }
        if (!alreadyAdded) {
          results.push({code: curProject.code, address: curProject.address});
        }
      });
      return results.sort();
    }
    return Projects.find({});
  };
  Template.selectProject.getProjectSearch = function () {
    return Session.get('projectSearch');
  };
  Template.selectProject.selectedProject = function () {
    if (Session.equals('curProject', this.code)) {
      return "selectedRow";
    }
  };
  Template.selectProject.nextAvailableNumber = function () {
    var highest = 0;
    Projects.find().forEach (function (curProject) {
      var intRegex = /[1-9][0-9]*/;
      var curCode = parseInt(intRegex.exec(curProject.code));
      if (curCode > highest) {
        highest = curCode;
      }
    });
    highest++;
    return "GB"+("000"+highest).slice(-4);
  };
  Template.selectProject.events({
    'click #testButton' : function () {
      Meteor.call('dbProjectsDrop');
    },
    'keyup #searchProjects' : function () {
      Session.set('projectSearch', $('#searchProjects').val().trim());
    },
    'click .projectList' : function () {
      Session.set('curProject', this.code);
    },
    'click .removeProjectBtn' : function () {
      if (confirm("Are you sure you want to delete this project?")) {
        var code = Session.get('curProject');
        Session.set('curProject', '');
        Meteor.call('dbProjectsRemove', code);
      }
    },
    'click #confirmProject' : function () {
      Session.set('curPage', 'inputData');
    },
    'click #createNewProject' : function () {
      var code = $('#newProject').val();
      Meteor.call('dbProjectsAdd', code);
      Session.set('curProject', code);
      Session.set('curPage', 'inputData');
    }
  });

  Template.inputData.curProject = function () {
    return Projects.findOne({code: Session.get('curProject')});
  };
  Template.inputData.saveDisabled = function () {
    if (Session.equals('saveDisabled', true)) {
      return "disabled";
    }
  };
  Template.inputData.lightList = function () {
    var projectDetails = Projects.findOne({code: this.code});
    return projectDetails.lightList;
  };
  Template.inputData.lightType = function () {
    return LightInfo.find({newType: /.+/});
  };
  Template.inputData.getDescription = function () {
    return LightInfo.findOne({type: this.type}).description;
  };
  Template.inputData.getNewDescription = function () {
    return LightInfo.findOne({type: this.newType}).description;
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
    'keyup .projectInfo' : function () {
      Session.set('saveDisabled', false);
    },
    'click .saveProjectBtn' : function () {
      Session.set('saveDisabled', true);
      // TODO sanity check, do not assume valid data
      Session.set('curProject', $('#contractNumber').val());
      // TODO write function
      Meteor.call('dbProjectsEdit', $('#contractNumber').val(),
                                    $('#buildingName').val(),
                                    $('#address').val(),
                                    $('#date').val(),
                                    $('#preparedBy').val(),
                                    $('#buildingManager').val(),
                                    $('#buildingManagerAddress').val(),
                                    $('#buildingManagerNumber').val(),
                                    $('#buildingManagerEmail').val());
    },
    'click .cancelProjectBtn' : function () {
      Session.set('saveDisabled', true);
      projectData = Projects.findOne({code: this.code});
      $('#contractNumber').val(projectData.code);
      $('#buildingName').val(projectData.buildingName);
      $('#address').val(projectData.address);
      $('#date').val(projectData.date);
      $('#preparedBy').val(projectData.prepBy);
      $('#buildingManager').val(projectData.buildingManager);
      $('#buildingManagerAddress').val(projectData.buildingManagerAddress);
      $('#buildingManagerNumber').val(projectData.buildingManagerNumber);
      $('#buildingManagerEmail').val(projectData.buildingManagerEmail);
    },
    'change #addLightType' : function () {
      var type = $('#addLightType').val();
      var newType = LightInfo.findOne({type: type}).newType;
      $('#addLightNew').val(newType);
      $('#addLightDescription').val(LightInfo.findOne({type: type}).description);
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
      if (confirm("Are you sure you want to delete this entry?")) {
        Meteor.call('dbProjectsRemoveLight', Session.get('curProject'), this.index);
      }
    },
    'click .editLightBtn' : function () {
      Session.set('selectedEditInput', this.index);
      $('#addLightLocation').val(this.location);
      $('#addLightType').val(this.type);
      $('#addLightDescription').val(LightInfo.findOne({type: this.type}).description);
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
      $('#addLightDescription').val('');
      $('#addLightQty').val('');
      $('#addLightHours').val('');
      $('#addLightTube').val('');
      $('#addLightAircon').val('');
      $('#addLightSensor').val('');
      $('#addLightNew').val('');
    }
  });
  
  Template.viewReport.reportType = function (type) {
    if (Session.equals('reportType', type)) {
      return "active";
    }
  };
  Template.viewReport.curProject = function () {
    return Projects.findOne({code: Session.get('curProject')});
  };
  Template.viewReport.getDescription = function () {
    return LightInfo.findOne({type: this.type}).description;
  };
  Template.viewReport.calculatedStats = function () {
    var values = HiddenValues.findOne({});
    var partsCost = 0;
    var labourCost = 0;
    var escDiscount = 0;

    var kwBefore = 0;
    var kwAfter = 0;
    this.lightList.forEach (function (curLight) {
      curLightInfo = LightInfo.findOne({type: curLight.type});
      curNewLightInfo = LightInfo.findOne({type: curLight.newType});
      
      partsCost += curLight.qty * curNewLightInfo.price;
      labourCost += curLight.qty * values.labourCost;
      //escDiscount += ?

      kwBefore += curLight.qty * curLightInfo.watts * curLight.hours / 1000;
      kwAfter += curLight.qty * curNewLightInfo.watts * curLight.hours / 1000;
    });

    var elecBefore = kwBefore * values.elecPrice;
    var elecAfter = kwAfter * values.elecPrice;
    var projCost = partsCost + labourCost;
    var netCost = projCost - escDiscount;
    var GST = netCost * 0.1;

    return {netCost: netCost.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,"),
            GST: GST.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,"),
            labourCost: labourCost.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,"),
            partsCost: partsCost.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,"),
            projCost: projCost.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,"),
            escDiscount: escDiscount.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,"),
            totalCost: (netCost + GST).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,"),
            
            kwBefore: kwBefore.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,"),
            kwAfter: kwAfter.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,"),
            kwSaving: (kwBefore - kwAfter).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,"),

            elecBefore: elecBefore.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,"),
            elecAfter: elecAfter.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,"),
            elecSaving: (elecBefore - elecAfter).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,")};
  };
  Template.viewReport.calculateAmount = function () {
    var price = +LightInfo.findOne({type: this.newType}).price;
    price *= this.qty;
    return price.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
  };
  Template.viewReport.events({
    'click #reportTable' : function () {
      Session.set('reportType', 'table');
    },
    'click #reportText' : function () {
      Session.set('reportType', 'text');
    }
  });

  Template.analysis.projectChosen = function () {
    return !Session.equals('curProject', '');
  };
  Template.analysis.analysisCalculation = function () {
    var results = [];
    var lights = Projects.findOne({code: Session.get('curProject')}).lightList;
    lights.forEach( function (curLight) {
      var found = -1;
      for (var i = 0; i < results.length; i++) {
        if (results[i].type == curLight.type && results[i].newType == curLight.newType) {
          found = i;
          break;
        }
      }
      if (found == -1) {
        var curLightInfo = LightInfo.find({type: curLight.newType});
        var type = curLight.type;
        var newType = curLight.newType;
        var qty = curLight.qty;
        //var payPerFitting = curLightInfo.payPerFitting;
        var payPerFitting = 10;
        var savingPerMonth = 0;
        var payPerMonth = payPerFitting * qty;
        var profitPerMonth = savingPerMonth - payPerMonth;
        results.push({type: type,
                      newType: newType,
                      qty: qty,
                      payPerFitting: payPerFitting.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,"),
                      savingPerMonth: savingPerMonth.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,"),
                      payPerMonth: payPerMonth.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,"),
                      profitPerMonth: profitPerMonth.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, "$1,")});
      }
    });
    return results;
  }

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
      // Make sure type and newType don't conflict with existing entires
      if (!Session.get('selectedEditInfo')) {
        LightInfo.find().forEach (function (curLight) {
          console.log("Comparing "+type+" and "+curLight.type);
          if (type == curLight.type) {
            errors += "Cannot have two entries of same type "+type+"\n";
            legal = false;
          }
          if (newType == curLight.newType && newType != "") {
            errors += "Cannot have two entries of same newType "+newType+"\n";
            legal = false;
          }
        });
      }
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
      if (confirm("Are you sure you want to delete this entry?")) {
        Meteor.call('dbLightInfoRemove', this.type);
      }
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
        Projects.insert({code: code, lightList: []});
      },
      dbProjectsEdit: function (code, buildingName, address, date, prepBy,
                                buildingManager, buildingManagerAddress, buildingManagerNumber, buildingManagerEmail) {
        Projects.update({code: code},
                        {$set: {code: code,
                                buildingName: buildingName,
                                address: address,
                                date: date,
                                prepBy: prepBy,
                                buildingManager: buildingManager,
                                buildingManagerAddress: buildingManagerAddress,
                                buildingManagerNumber: buildingManagerNumber,
                                buildingManagerEmail: buildingManagerEmail}});

      },
      dbProjectsRemove: function (code) {
        Projects.remove({code: code});
      },
      dbProjectsAddLight: function (code, location, type, qty, hours, tube, aircon, sensor, newType) {
        var index = Math.floor((Math.random()*1000)+1);
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
        Projects.update({code: code}, {$pull: {lightList: {_id: index}}});
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
