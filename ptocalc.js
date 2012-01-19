/**
* Return an object with the years + months since the start date
*/
function getTimeWorked(startDate, endDate) {
  if (endDate.getTime() < startDate.getTime()) {
    return {
      years: 0,
      months: 0
    };
  }
  
  var one_day = 1 * 1000 * 60 * 60 * 24;
  var one_year = one_day = 365 * one_day; // Yeah, yeah, screw leap years, DWI (TODO: fix it at some point or switch to date.js)
  
  var diff = endDate.getTime() - startDate.getTime();
  var diffYears = Math.floor(diff/one_year);
  
  timeWorked = {
    years: diffYears,
    months: Math.floor(((diff - (diffYears * one_year)) / one_year) * 12)
  }
  return timeWorked;
}

function getTotalPTO(user) {
  var timeWorked = getTimeWorked(user.startDate, user.endDate);
  var ptoTotal = 0;  
  var ptoPerYear = user.startingPTO;
  
  // Full years
  for (year = 0; year < timeWorked.years; year++) {
    ptoPerYear = user.startingPTO + (year * user.extraPTOperYear);
    ptoTotal += ptoPerYear;
  }
  
  // Months
  ptoTotal += (timeWorked.months * ptoPerYear) / 12;
  
  if (user.bonusPTO) {
    ptoTotal += user.bonusPTO;
  }
  return ptoTotal;
}

// Thank you, Stack Overflow
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function getRemainingPTO(user) {
  for (var key in user) {
    if (key == 'startDate' || key == 'endDate') {
	  if (!user[key] || isNaN(user[key])) {
        return false;
      }
    } else {      
      if (!isNumber(user[key])) {
		user[key] = 0;
      }
    }
  }
  var ptoTotal = getTotalPTO(user);
  return ptoTotal - user.ptoTaken;
}

function convertHoursToDays(hours, hoursPerWorkDay) {
  // in our default scenario, the workday is 9 hours
  if (!hoursPerWorkDay) {
    var hoursPerWorkDay = 9;
  }
  return (hours / hoursPerWorkDay);
}

/*
test1 = {
  startDate: new Date(2010,3,26),
  ptoTaken: convertHoursToDays(130.5),
  bonusPTO: 1,
};

test2 = {
  startDate: new Date(2008,8,2),
  ptoTaken: convertHoursToDays(472.5),
  bonusPTO: 3,
  startingPTO: 15,
  extraPTOperYear: 2,
};
*/

// Utility function that takes an element id and returns a date object
function _formDateToObj(id) {
  var date = $( id ).val();
  return new Date(Date.parse(date));
}

// Fetch and validate data from form
function getFormData() {
  var data = {};

  data.startDate = _formDateToObj("#startDate");
  data.endDate = _formDateToObj("#endDate");
  data.startingPTO = parseFloat($( "#startPTO" ).val());
  data.ptoTaken = parseFloat($( "#usedPTO" ).val());
  data.bonusPTO = parseFloat($( "#bonusPTO" ).val());
  data.extraPTOperYear = parseFloat($( "#extraPTO" ).val());

  return data;
}



// Init
$(function() {
  // Set up jQuery UI datepicker
  $( ".datepicker" ).datepicker({
    changeMonth: true,
    changeYear: true,
  });
  
  // Set end date to today by default
  //$( "#endDate" ).datepicker('setDate', new Date());
  $( "#endDate" ).datepicker({
    setDate: new Date(),
	minDate: new Date(),
  });
  
  $( "input.primary" ).click(function(e) {
    e.preventDefault();
    var data = getFormData();
    var PTOleft = getRemainingPTO(data);
    
    var message = document.createElement('div');
    message.setAttribute('id', 'message');
    
    if (PTOleft === false) {
      message.setAttribute('class', 'alert-message error');
      message.textContent = 'Blarghghh! Does not compute, recheck your values.';
    }
    else if (PTOleft > 5) {
      message.setAttribute('class', 'alert-message success');
      message.textContent  = 'You have ' + PTOleft.toFixed(2) + ' days of PTO left. Time to use some.';
    }
    else if (PTOleft > 0 && PTOleft < 5) {
      message.setAttribute('class', 'alert-message warning');
      message.textContent  = 'You still have ' + PTOleft.toFixed(2) + ' days of PTO left. It could be worse.';
    }
	else if (PTOleft === 0) {
      message.setAttribute('class', 'alert-message warning');
      message.textContent  = 'You have no PTO yet. Wait for it.';
    }
    else if (PTOleft < 0) {
      message.setAttribute('class', 'alert-message error');
      message.textContent  = 'You actually have a negative PTO (' + PTOleft.toFixed(2) + ') count. Good times.';
    }
    
    $( '#results' ).empty();
    $( '#results' ).append(message);
    //var results = document.getElementById('results');
    //results.appendChild(message);
  });
  
  // Toggle button for advanced options
  $( "#showoptions" ).click(function(e) {
    e.preventDefault();
    $( ".optional" ).toggle("slow");
    
    if ($(this).html() == 'Show configuration options') {
      $(this).html('Hide configuration options');
    } else {
      $(this).html('Show configuration options');
    }
  });
  
  // Save settings to local storage
  $( "#save" ).click(function(e) {
    e.preventDefault();
    var settings = {};
    settings.startDate = $( "#startDate" ).val();
    settings.startPTO = $( "#startPTO" ).val();
    settings.usedPTO = $( "#usedPTO" ).val();
    settings.bonusPTO = $( "#bonusPTO" ).val();
    settings.extraPTO = $( "#extraPTO" ).val();
    localStorage.setItem('ptocalc', JSON.stringify(settings));
    $( ".alert-message" ).remove();
    $( '<div class="alert-message success fade in"><a class="close" href="#">×</a>Settings saved to local storage.</div>' ).appendTo( "#results" );
    $( ".alert-message" ).alert();
    
  });
  
  // Load settings from local storage
  $( "#load" ).click(function(e) {
    e.preventDefault();
    var settings = JSON.parse(localStorage.getItem('ptocalc'));
    $( "#startDate" ).val(settings.startDate);
    $( "#startPTO" ).val(settings.startPTO);
    $( "#usedPTO" ).val(settings.usedPTO);
    $( "#bonusPTO" ).val(settings.bonusPTO);
    $( "#extraPTO" ).val(settings.extraPTO);
    $( ".alert-message" ).remove();
    $( '<div class="alert-message success fade in"><a class="close" href="#">×</a>Settings loaded from local storage.</div>' ).appendTo( "#results" );
    $(".alert-message").alert();
  });
  
  // Detect if local storage is supported, Modernizr style
  var hasStorage = (function() {
    try {
      return !!localStorage.getItem;
    } catch(e) {
      return false;
    }
  }());
  if (hasStorage) {
    $( '.settings' ).show();
  }
  
  /*
  $( "#xptomanual" ).click(function(e) {
    $( this ).toggleClass("active");
    $( "#extraPTOCont" ).empty();
    $('<input type="number" />').attr({
      "id": "extraPTO",
      "name": "extraPTO",
      "size": "0",
      "step": "0.5",
      "class": "span2"
    }).appendTo($("#extraPTOCont"));
  });
  
  $( "#xptoauto" ).click(function(e) {
    $( this ).toggleClass("active");
  });
  */
  
});
	
