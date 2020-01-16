/*! PDFix license http://pdfix.net/terms. Copyright (c) 2016 Pdfix. All Rights Reserved. */
////////////////////////////////////////////////////////////////////////////////////////////////////
// pdfix_forms.js
// Using ES5 standards
////////////////////////////////////////////////////////////////////////////////////////////////////
/* PDFix forms api initialization*/
document.addEventListener("DOMContentLoaded", acroform_init);

// forms_api_init
function acroform_init() {
  do_calculations();
}

// register_page_widgets - a script called at the end of the page content
// registers page widgetes (:input) for events
function register_page_widgets(pdfPage) {
  var widgetes = $(pdfPage).find("[data-type='pdf-page-annots'] > :input");
  widgetes.each( function(index, elem) {
          register_widget(elem);
          });
}

function register_widget(e) {
  var field_name = e.getAttribute("name");
//  console.log("register widget: " + field_name);
  var field_id = e.getAttribute("data-field-id");
  var annot_id = e.getAttribute("data-annot-id");
  // ignore element if any of above is undefined
  if (field_name == undefined || field_id == undefined || annot_id == undefined)
    return;
  e.addEventListener("focus", field_event);
  e.addEventListener("blur", field_event);
  e.addEventListener("change", field_event);
  e.addEventListener("click", field_event);
  e.addEventListener("keypress", field_event);
  //  field_add_annot(field_name, field_id, e);
}

// Array of all fields in the document
var Fields = [];
var calc_fields = []; // Arrray of all calculated fields in the document.

// register AcroForm field
// \param name Full name of the field
// \param id Unique identifier of the field
// \param value field's default value
function register_field(data) {
  if (Fields[data.name] != undefined)
    return;
  Fields[data.name] = new Field(data);
}

// register AcroForm calculated field
// \param name Full name of the field
function register_calc_field(name) {
  calc_fields.push(name);
}

/* Pdf JavaScript API */
////////////////////////////////////////////////////////////////////////////////////////////////////
// Border object
////////////////////////////////////////////////////////////////////////////////////////////////////
var border = new Object();
border.s = "solid";
border.b = "beveled";
border.d = "dashed";
border.i = "inset";
border.u = "underline";

////////////////////////////////////////////////////////////////////////////////////////////////////
// Color object
////////////////////////////////////////////////////////////////////////////////////////////////////
var color = new Object();
color.transparent = ["T"];
color.black = ["G", 0];
color.white = ["G", 1];
color.red = ["RGB", 1, 0, 0];
color.green = ["RGB", 0, 1, 0];
color.blue = ["RGB", 0, 0, 1];
color.cyan = ["CMYK", 1, 0, 0, 0];
color.magenta = ["CMYK", 0, 1, 0, 0];
color.yellow = ["CMYK", 0, 0, 1, 0];
color.dkGray = ["G", 0.25];
color.gray = ["G", 0.5];
color.ltGray = ["G", 0.75];
color.convert = function (colorArray, cColorspace) { }; //todo
color.equal = function (colorArray1, colorArray2) { }; //todo

////////////////////////////////////////////////////////////////////////////////////////////////////
// Field object
////////////////////////////////////////////////////////////////////////////////////////////////////

// Field object
// \param data Object contatining field data {name: 'Text1', id: '123', value: 'Hello!'}
// name an id are required
function Field(data) {
  this._data = data;
  // define required default values if not specified
  if (this._data.value == undefined) this._data.value = "";
  if (this._data.hidden == undefined) this._data.hidden = false;

  this._updateWidgets = function () {
    var field = this;
    $("[data-field-id='" + this._data.id + "']")
      .each(function (item) {
        // value
        if (field._data.type == "radio" || field._data.type == "checkbox") {
          // radio and checkbox controls
          if ($(this).val() == field.value)
            $(this).prop('checked', true);
          else 
            $(this).prop('checked', false);
        }
        else {
          // all other widget types
          $(this).val(field.getFormattedValue());
        }
        // hidden
        field.hidden ? $(this).hide() : $(this).show();
      });
  }

  Object.defineProperty(this, "name", {
    get: function () {
      return this._data.name;
    }
  })

  Object.defineProperty(this, "value", {
    get: function () {
      if (typeof this._value_tmp == "string" && this._value_tmp == "")
        return this._data.value;
      //if it's not a number return as is
      if (this._data.value.toString().search(/[^0123456789.]/) != -1)
        return this._data.value;
      //try to make number
      var x = parseFloat(this._data.value);
      if (!isNaN(x)) return x;
      return this._data.value;
    },
    set: function (value) {
      this._data.value = value;
      this._updateWidgets();
      //set value to all corresponding html form elements
      //      var field_element = null;
      //      var field_elements = document.getElementsByName(this._data.name);
      //      if (field_elements.length >= 1)
      //        field_element = field_elements[0];
      //      if (field_element == null) {
      //        //this field does not have any html elements yet
      //        return;
      //      }
      //      //do not update value of html elements for radio buttons, because it keeps the export value
      //      var elem_type = field_element.getAttribute("type");
      //      if (elem_type == "radio" || elem_type == "checkbox")
      //        return;
      //      var formated_value = this.getFormattedValue();
      //      var field_id = field_element.getAttribute("data-field-id");
      //      this._value_tmp = 1;
      //
      //      for (var i = 0; i < all_fields.length; i++) {
      //        var field = all_fields[i];
      //        if (field["id"] === field_id) {
      //          var items = document.getElementsByName(field["name"]);
      //          for (var j = 0; j < items.length ; j++) {
      //            items[j].value = formated_value;
      //          }
      //          break;
      //        }
      //      }
    }
  });
  Object.defineProperty(this, "valueAsString", {
    get: function () { return this._data.value.toString(); }
  });

  //bn: hidden property
  Object.defineProperty(this, "hidden", {
    get: function () {
      if (this._data.hidden == undefined) // default value false
        return false;
      return this._data.hidden;
    },
    set: function (val) {
      if (typeof val !== "boolean") return;
      this._data.hidden = val;
      this._updateWidgets();
    }
  });

  Object.defineProperty(this, "maxLength", {
    get: function () {
      return 0;
    },
    set: function (val) {
    }
  })

  //  if (elem != null) {
  //    this.maxLength = elem.getAttribute("maxLength");
  //    this.commitOnSelChange = elem.getAttribute("commitOnSelChange") == "true";
  //
  //    this._value = val;
  //    if (elem.type === "checkbox") {
  //      this._exportValue = this._value;
  //      if (elem.checked == false) this._value = "";                               //holds the field value
  //    }
  //    this.elem = elem;                                  //holds html element corresponding to the field
  //  }
  //  this._value = val;

  this.k = "K" + this._data.id + "()";  //keystroke JS = Keystroke in PDF
  this.c = "C" + this._data.id + "()"; //calculate JS = Calculate in PDF
  this.f = "F" + this._data.id + "()";  //format JS = Format in PDF
  this.v = "V" + this._data.id + "()";  //bn: validate JS function
  this.u = "U" + this._data.id + "()";  //click = Mouse Up JS function
  //this.d = "D" + id + "()";  // ??? = Mouse Down in PDF
  //this.enter = "Enter" + id + "()";  // ??? = Mouse Enter in PDF
  //this.exit = "Exit" + id + "()";  // ??? = Mouse Exit in PDF
  this.fo = "Fo" + this._data.id + "()";  // focus JS = Focus in PDF
  this.bl = "Bl" + this._data.id + "()";  //blur JS = Blur in PDF

  //  this.borderStyle = border.s;

  //methods
  this.clearItems = function () {
    for (var i = this.elem.options.length - 1; i >= 0; i--) {
      this.elem.remove(i);
    }
  };
  this.getFormattedValue = function () {
    create_event();
    event.type = "Field";
    event.name = "Format";
    event.target = this;
    event.source = this;
    event.maxLength = this.maxLength;
    event.willCommit = false;
    event.value = this.value.toString();
    event.rc = true;
    do_field_event();
    var ret = event.rc ? event.value : this.value;
    destroy_event();
    return ret.toString();
  };

  this.checkThisBox = function (nWidget, bCheckIt) {
    if (this._data.type != "checkbox" && this._data.type != "radio")
      return;
    // get the widget export value and set is as a field value
    if (bCheckIt == false) {
      if (this.value == this._data.exportValues[nWidget])
        this.value = "Off";
    }
    else {
      this.value = this._data.exportValues[nWidget];
    }
  }
}

// init_field
function init_field(name) {
  if (typeof (name) == "string")
    return Fields[name];
  return null;
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// App object singleton
////////////////////////////////////////////////////////////////////////////////////////////////////
var app = new function () {
  //properties
  this.viewerVersion = 1;
  this.viewerType = "PdfixHTML5";

  //methods
  this.response = function () { return null; };
  this.beep = function (b) { };
  this.alert = function (msg) {
    window.alert(msg);
    //console.log(msg);
  };
}

////////////////////////////////////////////////////////////////////////////////////////////////////
// Document object
////////////////////////////////////////////////////////////////////////////////////////////////////
//properties
this.external = false;
this.calculate = false;

//methods
this.calculateNow = function () {
  //allow calculations first
  var old_calculate = this.calculate;
  this.calculate = true;
  do_calculations();
  this.calculate = old_calculate;
};

this.getField = function (name) {
  return init_field(name);
};

this.resetForm = function (aFields) {
  for (var i = 0; i < all_fields.length; i++) {
    var field = all_fields[i];
    var element = document.getElementById(field["name"]);
    element.value = element.getAttribute("data-default-value");
  }
  calculateNow();
};

this.submitForm = function (cURL, bFDF, bEmpty, aFields, bGET, bAnnotations, bXML, bIncrChanges,
  bPDF, bCanonical, bExclNonUserAnnots, bExclFKey, cPassword, bEmbedForm, oJavaScript, cSubmitAs,
  bInclNMKey, aPackets, cCharset, oXML, cPermID, cInstID, cUsageRights) {

  var obj = {};
  for (var name in Fields) {
    var field = Fields[name];
    if (!field)
      throw "Field with name " + name + " does not exist";
    if (bEmpty != null && bEmpty == false && field.value == "")
      continue;
    obj[name] = field.value;
  }
  if (typeof SubmitForm === 'function') {
    SubmitForm(obj);
  } else {
    console.log("Method SubmitForm is not defined. Once it's deined submitting form data can be customized.");
  }
};

////////////////////////////////////////////////////////////////////////////////////////////////////
// Console object
////////////////////////////////////////////////////////////////////////////////////////////////////
console.println = function (text) { console.log(text); };

////////////////////////////////////////////////////////////////////////////////////////////////////
// Util object
////////////////////////////////////////////////////////////////////////////////////////////////////
var util = new function () { };

// util.printf
util.printf = function () {
  var i = 0;
  var format = arguments[i++];
  var regex = /%(,[0-3])?[+#0 ]?([.]\d)?[dfsx]/;

  while (i < arguments.length) {
    var arg = arguments[i++];
    var pos = format.search(regex);
    if (pos == -1)
      break;
    var nDecSep = 1;
    var cFlags = "";
    var nWidth = 0;
    var nPrecission = 0;
    var cConvChar = "";
    var n = pos + 1;
    var x = format.charAt(n++);
    if (x == ',') {
      nDecSep = parseInt(format.charAt(n++));
      x = format.charAt(n++);
    }
    while (x == '+' || x == '#' || x == '0' || x == " ") {
      cFlags += x;
      x = format.charAt(n++);
      if (cFlags.length == 4)
        break;
    }
    if (!isNaN(x)) {
      nWidth = parseInt(x);
      x = format.charAt(n++);
    }
    if (x == '.') {
      nPrecission = parseInt(format.charAt(n++));
      x = format.charAt(n++)
    }
    cConvChar = x;

    var front = format.substr(0, pos);
    var back = format.substr(x, format.length - x);

    //start formating
    if (cConvChar == "s") {
      arg = arg.toString();
    }
    else if (cConvChar == "x") {
      arg = arg.toString(16);
    }
    else if (cConvChar == "d" || cConvChar == "f") {
      arg = parseFloat(arg);
      if (isNaN(arg))
        arg = 0;
      var mul = Math.pow(10., nPrecission);
      arg = parseFloat(Math.round(arg * mul)) / mul;
      var parts = arg.toString().split('.');

      var t = "";
      var d = ".";
      switch (nDecSep) {
        case 0: t = ","; break;
        case 2: t = "."; d = ","; break;
      }

      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, t);
      arg = parts.join(d);
    }
    format = front + arg + back;
  }
  return format;
};

// util.printd
util.printd = function () {
  var i = 0;
  var format = arguments[i++];
  var date = arguments[i++];

  // TODO support for format type 0, 1, 2
  if (typeof (format) != "string") {
    format = "HH:MM:ss";
  }

  var yyyy = date.getFullYear();
  var yy = parseInt(yyyy.toString().substr(2, 2));
  var m = date.getMonth() + 1;
  var mmmm = fullMonths[m - 1];
  var mmm = months[m - 1];
  var d = date.getDate();
  var H = date.getHours();
  var M = date.getMinutes();
  var S = date.getSeconds();
  var ap = H >= 12 ? "pm" : "am";
  if (format.search("tt") != -1) {
    format = format.replace("tt", ap);
    if (H > 12) H -= 12;
  }

  //date
  format = format.replace("yyyy", yyyy);
  format = format.replace("yy", yy);
  format = format.replace("mmmm", mmmm);
  format = format.replace("mmm", mmm);
  format = format.replace("mm", m < 10 ? "0" + m : m);
  format = format.replace("m", m);
  format = format.replace("dd", d < 10 ? "0" + d : d);
  format = format.replace("d", d);

  //time
  format = format.replace("HH", H < 10 ? "0" + H : H);
  format = format.replace("H", H);
  format = format.replace("MM", M < 10 ? "0" + M : M);
  format = format.replace("M", M);
  format = format.replace("ss", S < 10 ? "0" + S : S);
  format = format.replace("s", S);

  return format;
};

util.printx = function (cFormat, cSource) {
  var format = "";
  var index = 0;
  // make cSource a string (can come as number or null)
  var tmp = "";
  if (cSource != null && !isNaN(cSource)) tmp += cSource;
  cSource = tmp;
  var size = cSource.length;

  for (var i = 0; (i < cFormat.length) && (index < size); i++) {
    var letter = cFormat[i];
    switch (letter) {
      case '?':
        format += cSource[index];
        index++;
        break;
      case 'X': {
        while (index < size) {
          if ((cSource[index] >= '0' && cSource[index] <= '9') ||
            (cSource[index] >= 'a' && cSource[index] <= 'z') ||
            (cSource[index] >= 'A' && cSource[index] <= 'Z')) {
            format += cSource[index];
            index++;
            break;
          }
          index++;
        }
        break;
      } break;
      case 'A': {
        while (index < size) {
          if ((cSource[index] >= 'a' && cSource[index] <= 'z') ||
            (cSource[index] >= 'A' && cSource[index] <= 'Z')) {
            format += cSource[index];
            index++;
            break;
          }
          index++;
        }
        break;
      } break;
      case '9': {
        while (index < size) {
          if (cSource[index] >= '0' && cSource[index] <= '9') {
            format += cSource[index];
            index++;
            break;
          }
          index++;
        }
        break;
      }
      case '*': {
        format.append(cSource, index, size - index);
        index = size - 1;
        break;
      }
      case '\\':
        break;
      case '>': {
        cSource = cSource.toUpperCase();
        break;
      }
      case '<': {
        cSource = cSource.toLowerCase();
        break;
      }
      case '=':
        break;
      default:
        format += letter;
        break;
    }
  }
  return format;
}

/* PDF Form Field events */
////////////////////////////////////////////////////////////////////////////////////////////////////
// Form fields
////////////////////////////////////////////////////////////////////////////////////////////////////
//var all_fields = [];  // All fields in the document.
//var calc_fields = []; // All calculated fields in tha document.

// Add a new widget annotation object into all fields annots array
// function field_add_annot(field_name, field_id, e) {
//   for (var i = 0; i < all_fields.length; i++) {
//     var field = all_fields[i];
//     if (field["id"] == field_id) {
//       if (e) {
//         var annot_id = e.getAttribute("data-annot-id");
//         e.value = this.getField(field_name).getFormattedValue();
//         field["annots"].push(annot_id);
//       }
//       return;
//     }
//   }
//   all_fields.push({ name: field_name, id: field_id, annots: [annot_id] });
//   // check if calculate callback for this field exist and push to calc_fields
//   if (typeof window["C" + field_id] === "function") {
//     calc_fields.push(field_name);
//   }
// }

////////////////////////////////////////////////////////////////////////////////////////////////////
// Events
////////////////////////////////////////////////////////////////////////////////////////////////////
// Global event object stack.
var events = [];
// Global event object.
var event = null;
// Stores current events stack.
var current_events = [];

// Create and push new event object
function create_event() {
  event = new Object();
  event.rc = true;
  events.push(event);
  return event;
}

// Pop a current event and restores previous
function destroy_event() {
  event = null;
  events.pop();
  if (events.length > 0)
    event = events[events.length - 1];
}

// do_field_event
function do_field_event() {
  if (current_events.find(function (obj) { if (obj == event.target) return obj; }) != undefined)
    return;
  current_events.push(event.target);
  try {
    if (event.name == "Keystroke")
      eval(event.target.k);
    else if (event.name == "Format")
      eval(event.target.f);
    else if (event.name == "Mouse Up")
      eval(event.target.u);
    else if (event.name == "Blur")
      eval(event.target.bl);
    else if (event.name == "Focus")
      eval(event.target.fo);
    else if (event.name == "Validate")  //bn: Validate
      eval(event.target.v);
  }
  catch (ex) {
    //console.log("error: do_field_event - " + ex.message + "[" + ex.description + "; " + ex.number + "]");
  }
  current_events.pop();
}

// field_event
function field_event(e) {
  var f = init_field(e.target.name);
  if (f == null)
    return;
  create_event();
  event.type = "Field";
  event.name = "Keystroke";
  event.target = f;
  event.source = f;
  event.maxLength = f.maxLength;
  event.willCommit = false;
  event.value = e.target.value.toString();

  var ignore_event = true;

  // keypress - focused text edit
  if (e.type == "keypress") {
    ignore_event = false;
    event.change = "";
    var keyCode = 0;
    if (e.keyCode != undefined && e.keyCode >= 20)
      keyCode = e.keyCode;
    else if (e.charCode != undefined && e.charCode >= 20)
      keyCode = e.charCode;
    if (keyCode != 0)
      event.change = String.fromCharCode(keyCode);
    event.selStart = e.target.selectionStart;
    event.selEnd = e.target.selectionEnd;
  }
  // change
  if (e.type == "change") {
    ignore_event = false;
    event.name = "Validate";   //bn: event Validate
    if (e.target.type == "select") {
      var index = e.target.selectedIndex;
      console.log(e.target.options[index].value);
      event.changeEx = e.target.options[index].value;
      //bn: comment next lines, do_calculations was proceed 2 times (line 750 - do_calculations(f)),
      /*
      do_field_event();
      if (event.rc)
        e.preventDefault();
      else {
        event.target.value = e.target.value;
        do_calculations(f);
      }*/
    }
    else {
      if (e.target.type == "radio" || e.target.type == "checkbox") {
        ignore_event = true;
      }
      event.value = e.target.value;
    }
    event.willCommit = true;
  }
  // click - radio button & check box
  if (e.type == "click") {
    ignore_event = false;
    event.name = "Mouse Up";
    if (e.target.type != "radio" && e.target.type != "checkbox" && e.target.type != "button") {
      ignore_event = true;
    }
    event.value = e.target.value;
    if (e.target.type == "checkbox") {
      if (!e.target.checked) event.value = "Off";
    }
    event.willCommit = true;
  }
  // focus
  if (e.type == "focus") {
    ignore_event = false;
    event.name = "Focus";
    if (e.target.type != "radio" && e.target.type != "checkbox") { //bn: prevent to rewrite the radio button value
      e.target.value = f.value;
    }
    e.target.addEventListener("keystroke", field_event);
    e.target.addEventListener("blur", field_event);
  }
  // blur
  if (e.type == "blur") {
    ignore_event = false;
    event.name = "Blur";
    e.target.removeEventListener("keystroke", field_event);
    e.target.removeEventListener("blur", field_event);
    if (e.target.type != "radio" && e.target.type != "checkbox") { //bn: prevent to rewrite the radio button value
      e.target.value = f.getFormattedValue();
    }
  }

  if (!ignore_event) {
    event.rc = true;
    do_field_event();
    if (event.rc == false) {
      if (event.willCommit) {
        if (e.target.type == "checkbox")
          e.target.checked = event.value === e.target.value;
        else
          e.target.value = event.target.value;
      }
      else
        e.preventDefault();
    }
    else if (event.willCommit) {
      event.target.value = event.value;
      if (e.target.type == "checkbox")
        e.target.checked = event.value === e.target.value;
      else
        e.target.value = event.target.value;
      do_calculations(f);
    }
  }

  var result = event.rc;
  destroy_event();
  return result;
}

// do_calculate
function do_calculate(id, source) {
  if (document.calculate == false)
    return;
  var f = init_field(id);
  if (f == null)
    return;
  create_event();
  event.type = "Field";
  event.name = "Calculate";
  event.targetName = f.name;
  event.target = f;
  event.value = f.value;
  event.source = source;
  event.willCommit = true;
  try {
    eval(f.c);
  }
  catch (ex) {
    console.log("do_calculate: " + ex.message);
  }
  if (event.rc == true)
    event.target.value = event.value;
  destroy_event();
}

// do_calculations
function do_calculations(source) {
  for (var i = 0; i < calc_fields.length; i++) {
    do_calculate(calc_fields[i], source);
  }
}
