;
(function () {
  'use strict';

  // registers the extension on a cytoscape lib ref
  var register = function (cytoscape, $) {

    if (!cytoscape || !$) {
      return;
    } // can't register if cytoscape unspecified

    var options = {
      node: {
        highlighted: {}, // styles for when nodes are highlighted.
        unhighlighted: {// styles for when nodes are unhighlighted.
          'opacity': 0.3
        }
      },
      edge: {
        highlighted: {}, // styles for when edges are highlighted.
        unhighlighted: {// styles for when edges are unhighlighted.
          'opacity': 0.3
        }
      },
      setVisibilityOnHide: false, // whether to set visibility on hide/show
      setDisplayOnHide: true, // whether to set display on hide/show
      neighbor: function(node){ // return desired neighbors of tapheld node
        return false;
      },
      neighborSelectTime: 500 //ms, time to taphold to select desired neighbors 
    };


    var undoRedo = require("./undo-redo");
    var viewUtilities = require("./view-utilities");

    cytoscape('core', 'viewUtilities', function (opts) {
      var cy = this;

      if (opts === 'get') {
        return viewUtilities;
      }

      $.extend(true, options, opts);

      function getScratch(eleOrCy) {
        if (!eleOrCy.scratch("_viewUtilities")) {
          eleOrCy.scratch("_viewUtilities", {});
        }

        return eleOrCy.scratch("_viewUtilities");
      }

      if (!getScratch(cy).initialized) {
        getScratch(cy).initialized = true;  

        viewUtilities(cy, options);
        
        if (cy.undoRedo) {
          var ur = cy.undoRedo(null, true);
          undoRedo(cy, ur, viewUtilities);
        }
        //Select the desired neighbors after taphold-and-free 
        cy.on('taphold', 'node', function(event){        
          var cyTarget = event.cyTarget;
          var tapheld = false;
          var neighborhood;
          var timeout = setTimeout(function(){ 
              cy.elements().unselect();
              neighborhood = options.neighbor(cyTarget);
              neighborhood.select();
              cyTarget.lock();
              tapheld = true;   
          }, options.neighborSelectTime - 500);
          cy.on('free', cyTarget, function(){
            if(tapheld === true){
              tapheld = false;
              neighborhood.select();
              cyTarget.unlock();
            }
            else{
                clearTimeout(timeout);
            }
          });
          cy.on('drag', cyTarget, function(){
            if(tapheld === false){
                clearTimeout(timeout);
            }
          })
        });
      }
      return viewUtilities;
    });

  };

  if (typeof module !== 'undefined' && module.exports) { // expose as a commonjs module
    module.exports = register;
  }

  if (typeof define !== 'undefined' && define.amd) { // expose as an amd/requirejs module
    define('cytoscape-view-utilities', function () {
      return register;
    });
  }

  if (typeof cytoscape !== 'undefined' && typeof $ !== "undefined") { // expose to global cytoscape (i.e. window.cytoscape)
    register(cytoscape, $);
  }

})();
