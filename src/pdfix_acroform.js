/*! PDFix license http://pdfix.net/terms. Copyright (c) 2016 Pdfix. All Rights Reserved. */
////////////////////////////////////////////////////////////////////////////////////////////////////
// pdfix_acroform.js
////////////////////////////////////////////////////////////////////////////////////////////////////

// constants
var DOUBLE_CORRECT = 0.000000000000001;

// errors 
var ERROR_AFNUMBER_KEYSTROKE = "The input value is invalid.";
var ERROR_AFRANGE_GT_AND_LT = "Invalid value: must be greater than or equal to %s and less than or equal to %s."
var ERROR_AFRANGE_GT = "Invalid value: must be greater than or equal to %s."
var ERROR_AFRANGE_LT = "Invalid value: must be less than or equal to %s."
var ERROR_PARSE_DATETIME = "The input value can't be parsed as a valid date/time (%s)."

var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var fullMonths = ["January", "February", "March", "April", "May", "Jun",
  "Jul", "August", "September", "October", "November", "December"];
var oldDateFormats = ["m/d", "m/d/yy", "mm/dd/yy", "mm/yy", "d-mmm", "d-mmm-yy", "dd-mmm-yy",  
  "yy-mm-dd", "mmm-yy", "mmmm-yy", "mmm d, yyyy", "mmmm d, yyyy", "m/d/yy h:MM tt", 
  "m/d/yy HH:MM"];
var dateFormats = ["m/d", "m/d/yy", "m/d/yyyy", "mm/dd/yy", "mm/dd/yyyy", "mm/yy", "mm/yyyy", 
  "d-mmm", "d-mmm-yy", "d-mmm-yyyy", "dd-mmm-yy", "dd-mmm-yyyy", "yy-mm-dd", "yyyy-mm-dd", 
  "mmm-yy", "mmm-yyyy", "mmmm-yy", "mmmm-yyyy", "mmm d, yyyy", "mmmm d, yyyy", "m/d/yy h:MM tt", 
  "", "m/d/yyyy h:MM tt", "m/d/yy HH:MM", "m/d/yyyy HH:MM"];
var timeFormats = ["HH:MM", "h:MM tt", "HH:MM:ss", "h:MM:ss tt"];

// global functions
function AFNumber_Format(nDec, sepStyle, negStyle, currStyle, strCurrency, bCurrencyPrepend) {
  var field = event.target;
  if (nDec < 0) nDec = -nDec;
  if (sepStyle < 0 || sepStyle > 3) sepStyle = 0;
  if (negStyle < 0 || negStyle > 3) negStyle = 0;
  // processing decimal places
  var value = parseFloat(event.value.replace(",", "."));
  if (!isNaN(value)) //bn: check that value is a number
  {
    if (value > 0) value += DOUBLE_CORRECT;
    // calculating number string
    var bNegative = value < 0;
    var strValue = Math.abs(value).toFixed(nDec);
    if (strValue.length == 0)
      strValue = "0";
    // processing separator style
    var decSeparator = ".";   // decimal separator
    var thSeparator = "";     // thousands separator
    switch (sepStyle) {
      case 0: thSeparator = ","; break;
      case 1: break;
      case 2: thSeparator = "."; decSeparator = ","; break;
      case 3: decSeparator = ","; break;
      case 4: thSeparator = "'"; break;
    }
    var parts = strValue.toString().split("."); // split by decimal separator
    if (thSeparator.length > 0) {
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thSeparator);
    }
    // build formatted string 
    var val = parts[0];
    if (parts.length > 1 && parts[1].length > 0) val = val + decSeparator + parts[1];
    if (bCurrencyPrepend)
      val = strCurrency + val;
    else
      val = val + strCurrency;

    if (negStyle != 0) {
      if (bNegative) {
        if (negStyle == 2 || negStyle == 3)
          val = "(" + val + ")";
        if (negStyle == 1 || negStyle == 3)
          field.color = color.red;
      }
      else {
        field.color = color.black;
      }
    }
    else if (bNegative)
      val = "-" + val;
  }
  else
    val="";
  event.value = val;
}

function AFNumber_Keystroke(nDec, sepStyle, negStyle, currStyle, strCurrency, bCurrencyPrepend) {
  var val = event.value;
  var change = event.change;

  if (event.willCommit) {
    var tmp = trim(val);
    if (tmp.length == 0)
      return;
    tmp.replace(",", ".");
    if (isNaN(tmp)) {
      event.rc = false;
      app.alert(ERROR_AFNUMBER_KEYSTROKE);
    }
    return;
  }
  // get selected text
  var strSelected = "";
  if (event.selStart != -1)
    strSelected = strSelected.substr(event.selStart, event.selEnd - event.selStart);
  
  var hasSign = (val.charAt(0) == '-' && strSelected.charAt(0) == '-');
  if (hasSign) {  //can't insert 'change' in front of sign position
    event.rc = false;
    return;
  }

  if (sepStyle < 0 || sepStyle > 3) sepStyle = 0;
  var sep = (sepStyle == 2 || sepStyle == 3) ? "," : ".";

  var hasSep = val.indexOf(sep) != -1;
  for (var i = 0; i < change.length; i++) {
    var ch = change.charAt(i);
    if (ch == sep) {
      if (hasSep) {
        event.rc = false;
        return;
      }
      hasSep = true;
      continue;
    }
    if (ch == '-') {
      if (  hasSign || i != 0 || event.selStart != 0) {
        // already has a sign or sign on wrong position 
        event.rc = false;
        return;
      }
      continue;
    }
    if (isNaN(parseFloat(ch))) {  //bn: instead of 'if (isNaN(ch))' to filter the empty spaces
      event.rc = false;
      return;
    }
  }

  var prefix = val.substr(0, event.selStart);
  var suffix = "";
  if (event.selEnd < val.length)
    suffix = val.substr(event.selEnd);
  val = prefix + change + suffix;
  event.value = val;
}

function AFPercent_Format(nDec, sepStyle) {
  if (nDec < 0) nDec = -nDec;
  if (sepStyle < 0 || sepStyle > 3) sepStyle = 0;
  var value = parseFloat(event.value.replace(",", "."));
  value *= 100;
  if (nDec > 0) value += DOUBLE_CORRECT;
  // calculating number string
  var bNegative = value < 0;
  var strValue = Math.abs(value).toFixed(nDec);
  if (strValue.length == 0)
    strValue = "0";
  // processing separator style
  var decSeparator = ".";   // decimal separator
  var thSeparator = "";     // thousands separator
  switch (sepStyle) {
    case 0: thSeparator = ","; break;
    case 1: break;
    case 2: thSeparator = "."; decSeparator = ","; break;
    case 3: decSeparator = ","; break;
    case 4: thSeparator = "'"; break;
  }
  var parts = strValue.toString().split("."); // split by decimal separator
  if (thSeparator.length > 0) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thSeparator);
  }
  // build formatted string 
  var val = parts[0];
  if (parts.length > 1 && parts[1].length > 0) val = val + decSeparator + parts[1];
  if (bNegative)
    val = "-" + val;
  val += "%";
  event.value = val;
}

function AFPercent_Keystroke(nDec, sepStyle) {
  return AFNumber_Keystroke(nDec, sepStyle, 0, 0, "", true);
}

function AFDate_FormatEx(cFormat) {
  if (event.value == "")
    return;
  var date = AFParseDateEx(event.value, cFormat);
  if (!date) {
    app.alert(util.printf(ERROR_PARSE_DATETIME, event.value));
    event.rc = false;
    return;
  }
  event.value = util.printd(cFormat, date);
}

function AFDate_KeystrokeEx(cFormat) {
  if (typeof event.value != "string") {
    event.rc = false;
    return;
  }
  if (event.value == "") return;
  var date = AFParseDateEx(event.value, cFormat);
  if (!date) {
    app.alert(util.printf(ERROR_PARSE_DATETIME, event.value));
    event.rc = false;
    return;
  }
  return true;
}

function AFDate_Format(nFormat) {
  if (nFormat < 0 || nFormat >= oldDateFormats.length) nFormat = 0;
  AFDate_FormatEx(oldDateFormats[nFormat]);  
}

function AFDate_Keystroke(nFormat) {
  if (nFormat < 0 || nFormat >= oldDateFormats.length) nFormat = 0;
  AFDate_KeystrokeEx(oldDateFormats[nFormat]);  
}

function AFTime_FormatEx(cFormat) {
  if (event.value == "")
    return;
  var date = AFParseDateEx(event.value, cFormat);
  if (!date) {
    app.alert(util.printf(ERROR_PARSE_DATETIME, event.value));
    event.rc = false;
    return;
  }
  event.value = util.printd(cFormat, date);
}

function AFTime_KeystrokeEx(cFormat) {
  if (event.value == "")
    return;
  var date = AFParseDateEx(event.value, cFormat);
  if (!date) {
    app.alert(util.printf(ERROR_PARSE_DATETIME, event.value));
    event.rc = false;
    return;
  }
}

function AFTime_Format(nFormat) {
  if (nFormat < 0 || nFormat >= timeFormats.length) nFormat = 0;
  AFTime_FormatEx(timeFormats[nFormat]);
}

function AFTime_Keystroke(cformat) {
  if (event.value == "")
    return;
  var date = AFParseDateEx(event.value, cFormat);
  if (!date) {
    app.alert(util.printf(ERROR_PARSE_DATETIME, event.value));
    event.rc = false;
    return;
  }
}

function AFSpecial_Format(psf) {
  // 0 - zip code, 1 - zip + 4, 2 - phone, 3 - SSN
  if (isNaN(psf)) return;
  var value = parseInt(event.value);
  switch (psf) {
    case 0: format = "99999"; break;
    case 1: format = "99999-9999"; break;
    case 2: format = value > 999999999 ? "(999) 999-9999" : "999-9999"; break;
    case 3: format = "999-99-9999"; break;
  }
  if (typeof format == "string")
    event.value = util.printx(format, value);
}

function AFSpecial_Keystroke(psf) {
  console.println("AFSpecial_Keystroke not implemented");
}

function AFSpecial_KeystrokeEx(mask) {
  console.println("AFSpecial_KeystrokeEx not implemented");
}

function AFSimple(cFunction, nValue1, nValue2) {
  switch (cFunction) {
    case "AVG": return (nValue1 + nValue2)/2.;
    case "SUM": return (nValue1 + nValue2);
    case "PRD": return (nValue1 * nValue2);
    case "MIN": return Math.min(nValue1, nValue2);
    case "MAX": return Math.max(nValue1, nValue2);
  }
  return nValue1;
}

function AFMakeNumber(string) {
  if (typeof string == "number")
    return string;
  var value = 0;
  if (typeof string == "string")
    value = parseFloat(string.replace(",", "."));
  if (isNaN(value))
    value = 0;
  return value;
}

function AFSimple_Calculate(cFunction, cFields) {
  var value = cFunction == "PRD" ? 1. : 0.;
  var fields = AFMakeArrayFromList(cFields);
  var count = 0;
  for (var i = 0; i < fields.length; i++) {
    var field = this.getField(fields[i]);
    if (field == null)
      continue;
    // TODO: field can be non-terminal, in that case each kid must be iteraded by field.getArray()
    var fieldValue = AFMakeNumber(field.value);
    if (i == 0 && (cFunction == "MIN" || cFunction == "MAX"))
      value = fieldValue;
    else
      value = AFSimple(cFunction, value, fieldValue);
    count++;
  }
  if (count > 0 && cFunction == "AVG")
    value /= count;
  event.value = value;
}

function AFRange_Validate(bGreaterThan, nGreaterThan, bLessThan, nLessThan) {
  if (event.value == "") return;
  var value = parseFloat(event.value.replace(",", "."));
  var gt = (!bGreaterThan || value >= nGreaterThan);
  var lt = (!bLessThan || value <= nLessThan);
  var err = "";
  if (!gt || !lt) {
    if (!gt && !lt) err = util.printf(ERROR_AFRANGE_GT_AND_LT, nGreaterThan, nLessThan);
    else if (!gt) err = util.printf(ERROR_AFRANGE_GT, nGreaterThan);
    else if (!lt) err = util.printf(ERROR_AFRANGE_LT, nLessThan);
    event.rc = false;
  }
  if (err.length > 0)
    app.alert(err);
}

function AFMergeChange(event) {
  if (event.willCommit) return event.value;
  var prefix = event.value.substr(0, event.selStart);
  var suffix = "";
  if (event.selEnd >= 0 && event.selEnd < val.length)
    suffix = val.substr(event.selEnd);
  return prefix + change + suffix;
}

function AFParseDateEx(cString, cOrder) {
  var date = new Date();

  if (!cString) return date;

  dd = 1;
  HH = 0;
  MM = 0;
  SS = 0;

  // regex test: https://regex101.com/r/Nepsz2/2
  if (dateFormats.findIndex(function (e) { return e == cOrder; }) != -1 ||
    timeFormats.findIndex(function (e) { return e == cOrder; }) != -1)
    regex = /^(\d{1,4}|[a-zA-Z]+)(?:[-/:,. ])?(\d{1,4}|[a-zA-Z]+)?(?:[,-:/.])?(?: )?(\d{1,4})?[ ]?(\d{1,2})?[:]?(\d{1,2})?[:]?(\d{1,2})?[ ]?(am|pm)?$/;

  if (typeof regex != "undefined") {
    var res = cString.match(regex);
    if (!res)
      return null;

    switch (cOrder) {
      case dateFormats[0]:   // m/d
      case dateFormats[1]:   // m/d/yy
      case dateFormats[2]:   // m/d/yyy
      case dateFormats[3]:   // mm/dd/yy
      case dateFormats[4]:   // mm/dd/yyyy
      case dateFormats[18]:   //mmm d, yyyy
      case dateFormats[19]:   //mmmm d, yyyy
      case dateFormats[20]:  // m/d/yy h:MM tt
      case dateFormats[21]:  // m/d/yyyy h:MM tt
      case dateFormats[22]:  // m/d/yy HH:MM
      case dateFormats[23]:  // m/d/yyyy HH:MM
        mm = res[1];
        dd = res[2];
        yy = res[3];
        HH = res[4];
        MM = res[5];
        tt = res[7];
        break;
      case dateFormats[5]:   // mm/yy
      case dateFormats[6]:   // mm/yyyy
      case dateFormats[14]:   //mmm-yy
      case dateFormats[15]:   //mmm-yyyy
      case dateFormats[16]:   //mmmm-yy
      case dateFormats[17]:   //mmmm-yyyy
        mm = res[1];
        yy = res[2];
        break;
      case dateFormats[7]:   //d-mmm
      case dateFormats[8]:   //d-mmm-yy
      case dateFormats[9]:   //d-mmm-yyyy
      case dateFormats[10]:   //dd-mmm-yy
      case dateFormats[11]:   //dd-mmm-yyyy
        dd = res[1];
        mm = res[2];
        yy = res[3];
        break;
      case dateFormats[12]:   //yy-mm-dd
      case dateFormats[13]:   //yyyy-mm-dd
        yy = res[1];
        mm = res[2];
        dd = res[3];
        break;
      case timeFormats[0]:    // HH:MM
      case timeFormats[1]:    // h:MM
      case timeFormats[2]:    // HH:MM:SS
      case timeFormats[3]:    // h:MM:SS tt
        HH = res[1];
        MM = res[2];
        SS = res[3];
        tt = res[7];
        break;
    }
  }

  // TODO: check value ranges ???
  if (typeof mm != "undefined") {
    if (!isNaN(mm))
      mm = parseInt(mm) - 1;
    else {
      mm = mm.substr(0, 3).toLowerCase();
      mm = months.findIndex(function (e) {
        return mm == e.toLowerCase();
      });
      if (mm < 0) return null;
    }
    date.setMonth(mm);
  }
  if (typeof dd != "undefined") {
    dd = parseInt(dd);
    if (!isNaN(dd)) date.setDate(dd);
  }
  if (typeof yy != "undefined") {
    yy = parseInt(yy);
    if (!!isNaN(yy)) {
      if (yy < 50) yy += 2000;
      else if (yy < 100) yy += 1900;
      date.setFullYear(yy);
    }
  }
  if (typeof HH != "undefined") {
    HH = parseInt(HH);
    if (!isNaN(HH)) {
      if (typeof tt == "string" && HH > 12 && tt.toLowerCase() === "pm") HH -= 12;
      date.setHours(HH);
    }
  }
  if (typeof MM != "undefined") {
    MM = parseInt(MM);
    if (!isNaN(MM)) date.setMinutes(MM);
  }
  if (typeof SS != "undefined") {
    SS = parseInt(SS);
    if (!isNaN(SS)) date.setSeconds(SS);
  }

  return date;
}

//function AFExtractNums(string) {
//}

function AFMakeArrayFromList(list) {
  var type = typeof list;
  if (type == "string")
    return list.split(",");
  else if (Array.isArray(list))
    return list;
  return [];
}
