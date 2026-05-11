// SPDX-FileCopyrightText: 2018 Tushar Mittal
// SPDX-FileCopyrightText: 2026 SPDX Contributors
// SPDX-License-Identifier: Apache-2.0

/**
 * Shared code used by both script.js (license XML editor) and ns_script.js
 * (license namespace XML editor). Load this file before either of those.
 */

/**
 * Object for autosuggestions while typing, based on SPDX license schema.
 * children: The tags which can be inside that tag
 * attrs: The attributes of that tag
 */
var xml_schema = {
    "!top": ["SPDXLicenseCollection"],
    SPDXLicenseCollection: {
        children: ['license', 'exception'],
        attrs: {
            "xmlns": null,
        }
    },
    exception: {
        attrs: {
            licenseId: null,
            name: null,
        },
        children: ["notes", "crossRefs", "text", ],
    },
    license: {
        attrs: {
            licenseId: null,
            name: null,
            isOsiApproved: ["true", "false"],
            listVersionAdded: null,
            isDeprecated: ["true", "false"],
            deprecatedVersion: null,
        },
        children: ["notes", "crossRefs", "text", "obsoletedBys", "standardLicenseHeader"],
    },
    crossRefs: {
        children: ["crossRef"],
    },
    obsoletedBys: {
        children: ["obsoletedBy"]
    },
    obsoletedBy: {
        attrs: {
            experssion: null,
        }
    },
    standardLicenseHeader: {
        children: ["p", "alt", "bullet", "br"]
    },
    alt: {
        attrs:{
            name: null,
            match: null,
        }
    },
    p: {
        children: ["optional", "br"],
    },
    optional: {
        children: ["p", "standardLicenseHeader", "optional", "alt"],
    },
    text: {
        children: ["titleText", "list", "copyrightText", "optional", "p", "alt", "standardLicenseHeader", "br", ]
    },
    titleText: {
        children: ["p", "alt", "optional", "br"]
    },
    copyrightText: {
        children: ["p", "alt", "optional"]
    },
    list: {
        children: ["item", "list"]
    },
    item: {
        children: ["p", "bullet", "br"]
    }
}

/* validates values in pull request form */
function checkPRForm(){
    var branchName = $("#branchName").val();
    if(branchName=="" || branchName.search(/^[\./]|\.\.|@{|[\/\.]$|^@$|[~^:\x00-\x20\x7F\s?*[\\]/g)>-1){
        return "Invalid branch name";
    }
    if(/^\s*$/.test($("#fileName").val())){
        return "Invalid file name";
    }
    if(/^\s*$/.test($("#commitMessage").val())){
        return "Invalid commit message";
    }
    if(/^\s*$/.test($("#prTitle").val())){
        return "Invalid pull request title"
    }
    return true;
}

/* generate diff of initial xml and current xml text */
function generate_diff(base, newtxt){
    var sm = new difflib.SequenceMatcher(base, newtxt);
    var opcodes = sm.get_opcodes();

    // build the diff view and add it to the current DOM
    var diff = $(diffview.buildView({
        baseTextLines: base,
        newTextLines: newtxt,
        opcodes: opcodes,
        // set the display titles for each resource
        baseTextName: "Base Text",
        newTextName: "New Text",
        contextSize: null,
        viewType: 1
    }))
    diff.children().remove("thead");
    diff.children().children().remove("th");
    /* display result in modal */
    displayModal("","success");
    $("#modal-body").html(diff);
    $("#modal-title").text("Diff between initial and current XML");
    $("#modal-body").addClass("diff-modal-body");
    $(".modal-dialog").addClass("diff-modal-dialog");
}

/* display message using modal */
function display_message(message){
    $("#modal-body").removeClass("diff-modal-body pr-modal-body");
    $("#modal-header").removeClass("red-modal");
    $("#modal-header").removeClass("yellow-modal");
    $("#modal-header").addClass("green-modal");
    $("#modal-title").html("License XML editor");
    $("#modal-body").html("<p>"+message+"</p>");
    $('button.close').remove();
    $('<button type="button" class="close" data-dismiss="modal">&times;</button>').insertBefore($("h4.modal-title"));
    $(".modal-footer").html('<button class="btn btn-default" data-dismiss="modal">OK</button>')
    $("#myModal").modal({
        backdrop: 'static',
        keyboard: true,
        show: true
    });
    setTimeout(function() {
        $(".close").click();
    }, 15000);
    $(".close").click(function(){
        editor.focus();
    })
}

/* File download functions */
function saveTextAsFile() {
    var xmlText = "";
    var activeTab = $(".nav-tabs").find("li.active").find("a").attr("id");
    if(activeTab=="tabTextEditor"){
        if(!convertTextToTree(editor, 'treeView')){
            displayModal("The file you are downloading is not a valid XML.", "alert");
        }
        xmlText = editor.getValue().trim();
    }
    else if(activeTab=="tabTreeEditor"){
        xmlText = updateTextEditor(editor, 'treeView');
        if(xmlText==0){
            displayModal("The file you are downloading is not a valid XML.", "alert");
            xmlText = latestXmlText;
        }
    }
    else if(activeTab=="tabSplitView"){
        if(!convertTextToTree(splitTextEditor, 'splitTreeView')){
            displayModal("The file you are downloading is not a valid XML.", "alert");
        }
        xmlText = splitTextEditor.getValue().trim();
    }
    var textBlob = new Blob([xmlText], { type: 'application/xml' });
    var fileName = "license.xml";

    var downloadLink = document.createElement("a");
    downloadLink.download = fileName;
    downloadLink.innerHTML = "Hidden Download Link";
    window.URL = window.URL || window.webkitURL;

    downloadLink.href = window.URL.createObjectURL(textBlob);
    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}
function destroyClickedElement(e){
    document.body.removeChild(e.target);
}
$("#download").click(function(e){
    e.preventDefault();
    saveTextAsFile();
});

/* alert before leaving the page */
window.onbeforeunload = function (e) {
    return "Are you sure you want to leave? All the changes will be lost. You can either download the XML document or submit changes for review.";
}
