//= require voltron

/**
 * Voltron::Observer
 *
 * Adds ability to monitor DOM events that can be observed by means of the +Voltron.on()+ method
 *
 * List of events that can now be observed:
 *
 *   +append+ When an element is append to the DOM
 *   +remove+ When an element is removed from the DOM
 *   +conceal+ When an element on the DOM is hidden (defined as the result of jQuery's `:hidden` selector)
 *   +reveal+ When an element on the DOM is displayed (defined as the result of jQuery's `:visible` selector)
 *
 * Example usage, from within any method defined in a Voltron module:
 *
 *   Voltron.on('append:div', function(o){
 *     // Do things with the appended element, context is +Voltron+
 *   });
 *   
 *   OR
 *
 *   this.on('append:div', function(o){
 *     // Do things with the appended element, context is the module in which this observer was defined
 *   });
 *
 */
Voltron.addModule('Observer', '*', function(){
  'use strict';

  var _observer = null;

  var _defaults = {
    subtree: true,
    childList: true,
    characterData: false,
    attributes: true,
    attributeFilter: ['style', 'class']
  };

  return {
    initialize: function(options){
      options = $.extend(_defaults, options);
      this.getObserver().observe(document.body, options);

      // Trigger append and reveal events on start up for appropriate elements
      $('[data-dispatch*="append"]').trigger('append');
      $('[data-dispatch*="reveal"]:visible').trigger('reveal');
    },

    stop: function(){
      this.getObserver().disconnect();
    },

    process: function(mutations){
      // Get a unique array of DOM elements that each has the associated mutation as a part of it's dataset
      var elements = this.getMutationElements(mutations);

      // Iterate through each element, dispatching the appropriate event for each elements mutation
      for(var i=0; i<elements.length; i++){
        var mutation = $(elements[i]).data('_mutation');

        if(!mutation || !mutation.type) continue;

        if(mutation.type == 'childList'){
          // Flag nodes that have been added, and don't dispatch on any that have
          // This solves the issue of recursion if an element that dispatches `added` is moved in the DOM
          // Also dispatch only on elements that are configured to have `added` dispatched,
          // including the element itself if applicable
          $(mutation.addedNodes).filter(function(){
            return !$(this).data('_mutation_appended');
          }).data('_mutation_appended', true)
            .find('[data-dispatch*="append"], [data-dispatch*="reveal"]:visible')
            .addBack('[data-dispatch*="append"], [data-dispatch*="reveal"]:visible')
            .trigger('append')
            .trigger('reveal');

          // Flag nodes that have been removed to avoid unnecessary dispatching
          // Dispatch the removed event on any child elements configured to do so,
          // including the element itself if applicable
          // Event must be dispatched manually since at this point the element no
          // longer exists in the DOM, and can't be trigger()'ed
          $(mutation.removedNodes).filter(function(){
            return !$(this).data('_mutation_removed');
          }).data('_mutation_removed', true)
            .find('[data-dispatch*="remove"], [data-dispatch*="conceal"]')
            .addBack('[data-dispatch*="remove"], [data-dispatch*="conceal"]')
            .each(function(){
              Voltron.getModule('Dispatch').trigger.call(this, $.Event('remove', { target: this }));
              Voltron.getModule('Dispatch').trigger.call(this, $.Event('conceal', { target: this }));
            });
        }else if(mutation.type == 'attributes'){
          var target = $(mutation.target);
          // If currently animating, break out. We only want to dispatch when the state is truly reached
          if(target.is(':animated')) break;

          if(target.is(':hidden')){
            target.find('[data-dispatch*="conceal"]').addBack().trigger('conceal');
          }else if(target.is(':visible')){
            target.find('[data-dispatch*="reveal"]').addBack().trigger('reveal');
          }
        }
      }
    },

    getObserver: function(){
      if(_observer === null){
        _observer = new MutationObserver($.proxy(function(mutations){
          // Process all of the elements with mutations
          this.process(mutations);
        }, this));
      }
      return _observer;
    },

    getMutationElements: function(mutations){
      if($.isFunction($.uniqueSort)){
        // >= jQuery 3
        return $.uniqueSort($.map(mutations, function(mut){
          return $(mut.target).data('_mutation', mut).get(0);
        }));
      }else{
        // < jQuery 3
        return $.unique($.map(mutations, function(mut){
          return $(mut.target).data('_mutation', mut).get(0);
        }));
      }
    }
  };
}, true);