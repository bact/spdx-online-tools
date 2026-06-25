// SPDX-FileCopyrightText: 2018 Tushar Mittal
// SPDX-License-Identifier: Apache-2.0

// xml_schema, checkPRForm, generate_diff, display_message, saveTextAsFile,
// destroyClickedElement, download handler, and window.onbeforeunload are
// defined in editor_shared.js which must be loaded before this file.

/**
 * editor: object of main text editor, global variable
 * splitTextEditor: object of text editor in split view, global variable
 * initialXmlText: contains initial xml text, global variable
 * latestXmlText: contains updated and valid xml text , global variable
 */
var editor = "", splitTextEditor = "", initialXmlText = "", latestXmlText = '', beautifiedXmlText = '';
$(document).ready(function(){
    /* initialize bootstrap tooltip */
    $('[data-toggle="tooltip"]').tooltip();
    /* initialize the editor */
    var fontSize = 14, fullscreen = false;
    $(".starter-template").css('text-align','');
    /* main text editor object */
    editor = CodeMirror.fromTextArea($(".codemirror-textarea")[0], {
        lineNumbers: true,
        mode: "xml",
        indentUnit: 4,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        lineWrapping: true,
        showCursorWhenSelecting: true,
        lineWiseCopyCut: false,
        autofocus: true,
        cursorScrollMargin: 5,
        styleActiveLine: true,
        styleActiveSelected: true,
        autoCloseBrackets: true,
        matchTags: {bothTags: true},
        extraKeys: {
            "F11": fullScreen,
            "Esc": exitFullScreen,
            "Ctrl-J": "toMatchingTag",
            "'<'": completeAfter,
            "'/'": completeIfAfterLt,
            "' '": completeIfInTag,
            "'='": completeIfInTag,
        },
        hintOptions: {schemaInfo: xml_schema},
        showTrailingSpace: true,
        autoCloseTags: true,
        foldGutter: true,
    });
    /* object of text editor in split view */
    splitTextEditor = CodeMirror.fromTextArea($(".codemirror-textarea")[1], {
        lineNumbers: true,
        mode: "xml",
        indentUnit: 4,
        gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        lineWrapping: true,
        showCursorWhenSelecting: true,
        lineWiseCopyCut: false,
        autofocus: true,
        cursorScrollMargin: 5,
        styleActiveLine: true,
        styleActiveSelected: true,
        autoCloseBrackets: true,
        matchTags: {bothTags: true},
        extraKeys: {
            "F11": fullScreen,
            "Esc": exitFullScreen,
            "Ctrl-J": "toMatchingTag",
            "'<'": completeAfter,
            "'/'": completeIfAfterLt,
            "' '": completeIfInTag,
            "'='": completeIfInTag,
        },
        hintOptions: {schemaInfo: xml_schema},
        showTrailingSpace: true,
        autoCloseTags: true,
        foldGutter: true,
    });
    $(".CodeMirror").css("font-size",fontSize+'px');
    editor.setSize(($(window).width)*(0.9), 500);
    splitTextEditor.setSize(($(".splitTextEditorContainer").width)*(0.9), 550);
    beautify(editor.getValue().trim());
    initialXmlText = beautifiedXmlText;
    beautify(editor.getValue().trim());
    latestXmlText = beautifiedXmlText;

    /* Decrease editor font size */
    $("#dec-fontsize").click(function(){
        fontSize -= 1;
        $(".CodeMirror").css("font-size",fontSize+'px');
        editor.refresh();
    })

    /* Increase editor font size */
    $("#inc-fontsize").click(function(){
        fontSize += 1;
        $(".CodeMirror").css("font-size",fontSize+'px');
        editor.refresh();
    })

    /* Show autocomplete hints while typing based
       on the XML Schema object */
    function completeAfter(cm, pred) {
        var cur = cm.getCursor();
        if (!pred || pred()) setTimeout(function() {
          if (!cm.state.completionActive)
            cm.showHint({completeSingle: false});
        }, 100);
        return CodeMirror.Pass;
    }
    function completeIfAfterLt(cm) {
        return completeAfter(cm, function() {
          var cur = cm.getCursor();
          return cm.getRange(CodeMirror.Pos(cur.line, cur.ch - 1), cur) == "<";
        });
    }
    function completeIfInTag(cm) {
        return completeAfter(cm, function() {
          var tok = cm.getTokenAt(cm.getCursor());
          if (tok.type == "string" && (!/['"]/.test(tok.string.charAt(tok.string.length - 1)) || tok.string.length == 1)) return false;
          var inner = CodeMirror.innerMode(cm.getMode(), tok.state).state;
          return inner.tagName;
        });
    }

    /* Enter and Exit fullscreen */
    $("#fullscreen").click(fullScreen);
    function fullScreen(){
        if (!editor.getOption("fullScreen")) editor.setOption("fullScreen", true);
        display_message("Press Esc to exit fullscreen");
        fullscreen = true;
        editor.focus();
    }
    function exitFullScreen(){
        if (editor.getOption("fullScreen")) {
            editor.setOption("fullScreen", false);
            fullscreen = false;
            editor.focus();
        } else {
            /* Not in fullscreen — release focus back to the active tab link
               so the user can Tab forward to the action buttons. */
            var activeTabLink = document.querySelector('.nav-tabs [role="tab"][aria-selected="true"]');
            if (activeTabLink) activeTabLink.focus();
        }
    }

    /* make editor responsive, whenever browser is resized,
       set the editor width to 90% of window width */
    $(window).resize(function(){
        splitTextEditor.setSize(($(".splitTextEditorContainer").width)*(0.9), 500);
        editor.setSize(($(window).width)*(0.9), 500);
        if (fullscreen){
            $(".CodeMirror-fullscreen").css("height","auto");   
        }
        splitTextEditor.refresh();
        editor.refresh();
    })

    /* beautify XML */
    $("#beautify").on("click",function(){
        var xmlText = editor.getValue().trim();
        beautify(xmlText);
        editor.setValue(beautifiedXmlText);
        editor.focus();
    })

    /* update split tree editor when split text editor loses focus */
    splitTextEditor.on('blur', function(){
        convertTextToTree(splitTextEditor, 'splitTreeView');
    })

    /* Syncs the XML text in all 3 views */
    $("#tabTextEditor").click(function(){
        /* activeTab: currently active tab, from which the user is switching to text editor view */
        var activeTab = $(".nav-tabs").find("li.active").find("a").attr("id");
        if(activeTab=='tabTreeEditor'){
            /* check for open textboxes */
            if(checkPendingChanges("#treeView")){
                /* switch to text editor view */
                $('#tabSplitView, #tabTreeEditor').removeAttr("data-toggle");
                $(this).attr("data-toggle","tab");
                /* update the text editor with content of tree editor */
                var temp = updateTextEditor(editor, 'treeView');
                /* if xml is invalid, use the latestXmlText variable */
                if(temp===0) editor.setValue(latestXmlText);
                else latestXmlText = temp;
                /* refresh and focus on the editor */
                setTimeout(function(){
                    editor.refresh();
                    editor.focus();
                },200);
            }
        }
        else if(activeTab=='tabSplitView'){
            /* check for open textboxes */
            if(checkPendingChanges("#splitTreeView")){
                /* switch to text editor view */
                $('#tabSplitView, #tabTreeEditor').removeAttr("data-toggle");
                $(this).attr("data-toggle","tab");
                /* update the text editor with the value of split view editor */
                beautify(splitTextEditor.getValue().trim());
                latestXmlText = beautifiedXmlText;
                editor.setValue(latestXmlText);
                /* refresh and focus on the editor */
                setTimeout(function(){
                    editor.refresh();
                    editor.focus();
                },200);
            }
        }
    })
    $("#tabTreeEditor").click(function(){
        /* activeTab: currently active tab, from which the user is switching to tree editor view */
        var activeTab = $(".nav-tabs").find("li.active").find("a").attr("id");
        if(activeTab=='tabTextEditor'){
            /* switch to tree editor view */
            $('#tabSplitView, #tabTextEditor').removeAttr("data-toggle");
            $(this).attr("data-toggle","tab");
            /* convert the xml text to tree and update latestXmlText */
            convertTextToTree(editor, 'treeView')
            beautify(editor.getValue().trim());
            latestXmlText = beautifiedXmlText;
        }
        else if(activeTab=='tabSplitView'){
            /* check for any open textboxes */
            if(checkPendingChanges("#splitTreeView")){
                /* switch to tree editor view */
                $('#tabSplitView, #tabTextEditor').removeAttr("data-toggle");
                $(this).attr("data-toggle","tab");
                /* convert the xml text in split editor to tree and update latestXmlText */
                convertTextToTree(splitTextEditor, 'treeView')
                beautify(splitTextEditor.getValue().trim());
                latestXmlText = beautifiedXmlText;
            }
        }
    })
    $("#tabSplitView").click(function(){
        var activeTab = $(".nav-tabs").find("li.active").find("a").attr("id");
        if(activeTab=='tabTreeEditor'){
            /* check for any open textboxes */
            if(checkPendingChanges("#treeView")){
                /* switch to split view */
                $('#tabTreeEditor, #tabTextEditor').removeAttr("data-toggle");
                $(this).attr("data-toggle","tab");
                /* update split text editor with content of tree editor */
                var temp = updateTextEditor(splitTextEditor, 'treeView');
                /* if xml is invalid, use the latestXmlText variable */
                if(temp===0) splitTextEditor.setValue(latestXmlText);
                else latestXmlText = temp;
                /* use the text in split text editor to updated split tree editor */
                convertTextToTree(splitTextEditor, 'splitTreeView');
                setTimeout(function(){
                    splitTextEditor.refresh();
                    splitTextEditor.focus();
                },200);
            }
        }
        else if(activeTab=='tabTextEditor'){
            /* switch to text editor view */
            $('#tabTreeEditor, #tabTextEditor').removeAttr("data-toggle");
            $(this).attr("data-toggle","tab");
            /* update the split text editor with the value of text editor */
            currentXmlText = editor.getValue().trim();
            beautify(currentXmlText);
            latestXmlText = beautifiedXmlText;
            splitTextEditor.setValue(latestXmlText);
            /* use the text in split text editor to updated split tree editor */
            convertTextToTree(splitTextEditor, 'splitTreeView');
            setTimeout(function(){
                splitTextEditor.refresh();
                splitTextEditor.focus();
            },200);
        }
    })

    /* calls generate_diff when generate diff button is clicked */
    $("#generateDiff").click(function(event){
        event.preventDefault();
        $("#messages").html("");
        /* find the view user is working on and extract the text from that editor */
        var activeTab = $(".nav-tabs").find("li.active").find("a").attr("id");
        if(activeTab=="tabTextEditor"){
            text2 = editor.getValue().trim();
        }
        else if(activeTab=="tabTreeEditor"){
            text2 = updateTextEditor(editor, 'treeView');
            if(text2==0){
                text2 = latestXmlText
            }
        }
        else if(activeTab=="tabSplitView"){
            text2 = splitTextEditor.getValue().trim()
        }
        else{
            text2 = latestXmlText
        }
        /* removing extra sapces from xml text */
        initialXmlText = initialXmlText.replace(/\s{2,}/g,' ').replace(/\n/g,' ');
        text2 = text2.replace(/\s{2,}/g,' ').replace(/\n/g,' ');
        generate_diff(initialXmlText.replace(/>\s{0,}</g,"><").replace(/\s{0,}</g,"~::~<").split('~::~'),text2.replace(/>\s{0,}</g,"><").replace(/\s{0,}</g,"~::~<").split('~::~'));
        $("div.tooltip").remove();
    })

    /* calls the validate_xml view using ajax and displays result */
    $("#validateXML").click(function(event){
        event.preventDefault();
        $("#validateXML").text("Validating...");
        $("#validateXML").prop('disabled', true);
        /* find the view user is working on and extract the text from that editor */
        var activeTab = $(".nav-tabs").find("li.active").find("a").attr("id");
        if(activeTab=="tabTextEditor"){
            xmlText = editor.getValue().trim();
        }
        else if(activeTab=="tabTreeEditor"){
            xmlText = updateTextEditor(editor, 'treeView');
            if(xmlText==0){
                xmlText = latestXmlText
            }
        }
        else if(activeTab=="tabSplitView"){
            xmlText = splitTextEditor.getValue().trim()
        }
        else{
            xmlText = latestXmlText
        }
        /* call ajax with xml text */
        var form = new FormData($("#form")[0]);
        form.append("xmlText", xmlText);
        $.ajax({
            type: "POST",
            enctype: 'multipart/form-data',
            url: "/app/validate_xml/",
            processData: false,
            contentType: false,
            cache: false,
            dataType: 'json',
            timeout: 600000,
            data: form,
            success: function (data) {
                if(data.type=="valid"){
                    displayModal("<p>"+data.data+"</p>","success");
                }
                else{
                    displayModal("<p>"+data.data+"</p>","alert");
                }
                $("#validateXML").text("Validate");
                $("#validateXML").prop('disabled', false);
            },
            error: function (e) {
                try {
                    var obj = JSON.parse(e.responseText);
                    if (obj.type=="warning"){
                        displayModal(obj.data, "alert");
                    }
                    else if (obj.type=="error"){
                        displayModal(obj.data, "error");
                    }
                }
                catch (e){
                    displayModal("The application could not be connected. Please try later.","error");
                }
                $("#validateXML").text("Validate");
                $("#validateXML").prop('disabled', false);
            }
        });
    })

    $("#makePullRequest").click(function(){
        var githubLogin = $("#githubLogin").text();
        $("#modal-body").removeClass("diff-modal-body");
        $(".modal-dialog").removeClass("diff-modal-dialog");
        $("#modal-title").html("License XML editor");
        $('button.close').remove();
        /* if user not authenticated using GitHub, display modal with login button */
        if(githubLogin == "False"){
            $("#modal-header").removeClass("red-modal green-modal");
            $("#modal-header").addClass("yellow-modal");
            $(".modal-footer").html('<button class="btn btn-default pull-left" data-dismiss="modal"><span class="glyphicon glyphicon-remove"></span> Cancel</button><button class="btn btn-success" id="github_auth_begin"><span class="glyphicon glyphicon-ok"></span> Confirm</button>');
            $("#modal-body").html("You will now be redirected to the GitHub website to authenticate with the SPDX GitHub App. Please allow all the requested permissions for the app to work properly. After coming back to this page please click the Submit Changes button again to create a Pull Request.");
        }
        /* if user logged in using GitHub, display the pull request form */
        else if(githubLogin == "True"){
            $("#modal-header").removeClass("red-modal yellow-modal");
            $("#modal-header").addClass("green-modal");
            $(".modal-footer").html('<button class="btn btn-default pull-left" id="prCancel" data-dismiss="modal"><span class="glyphicon glyphicon-remove"></span> Cancel</button><button class="btn btn-success" id="prOk"><span class="glyphicon glyphicon-ok"></span> Confirm</button>');
            $("#modal-body").html($("#prFormContainer").html());
            $("#githubPRForm").css("display","block");
            $(".ajax-loader").css("display","none");
            $("#modal-body").addClass("pr-modal-body");
            $("#prOk, #prCancel").prop('disabled', false);
        }
        $("div.tooltip").remove();
        $('[data-toggle="tooltip"]').tooltip();
        $("#myModal").modal({
            backdrop: 'static',
            keyboard: true,
            show: true
        });
    })
});

/* if user submits the pull request form */
$(document).on('click','button#prOk',function(event){
    event.preventDefault();
    /* call the makePR function, display error message if invalid value in form */
    var response = makePR();
    if(response!=true){
        $('<div class="alert alert-danger" style="font-size:15px;"><strong>Error!</strong> '+response+'</div>').insertBefore("#githubPRForm");
        setTimeout(function() {
            $(".alert").remove();
        }, 3000);
    }
});

/* update XML text in session variables and login with GitHub */
$(document).on('click','button#github_auth_begin',function(event){
    event.preventDefault();
    var activeTab = $(".nav-tabs").find("li.active").find("a").attr("id");
    if(activeTab=="tabTextEditor"){
        xmlText = editor.getValue().trim();
    }
    else if(activeTab=="tabTreeEditor"){
        xmlText = updateTextEditor(editor, 'treeView');
        if(xmlText==0){
            xmlText = latestXmlText
        }
    }
    else if(activeTab=="tabSplitView"){
        xmlText = splitTextEditor.getValue().trim()
    }
    else{
        xmlText = latestXmlText
    }
    var githubLoginLink = $("#githubLoginLink").text();
    var page_url = window.location.href;
    githubLoginLink += "?next=" + page_url;
    page_id = page_url.split("/");
    page_id = page_id[page_id.length-2];
    license_name = $("#licenseName").text();
    /* call update_session_variable view using ajax with latest xml text */
    var form = new FormData($("#form")[0]);
    form.append("xml_text",xmlText);
    form.append("page_id",page_id);
    form.append("license_name", license_name);
    $.ajax({
        type: "POST",
        enctype: 'multipart/form-data',
        url: "/app/update_session/",
        processData: false,
        contentType: false,
        cache: false,
        dataType: 'json',
        timeout: 600000,
        data: form,
        async: false,
        /* if session variable updated successfully, redirect to GitHub login page */
        success: function (data) {
            window.location = githubLoginLink;
        },
        error: function(e){
            displayModal("The application could not be connected. Please try later.","error");
        }
    });
});

/* validates values in pull request form */

/* sends ajax request to pull_request view */
function makePR(data=null){
    /* if invalid values in form return */
    var check = checkPRForm();
    if(check!=true) return check;
    /* hide form and display loding animation */
    $("#prOk, #prCancel").html("Processing...");
    $("#prOk, #prCancel").prop('disabled', true);
    $("#githubPRForm").css("display","none");
    $(".ajax-loader").css({"display":"block"});
    /* find the view user is working on and extract the text from that editor */
    var activeTab = $(".nav-tabs").find("li.active").find("a").attr("id");
    if(activeTab=="tabTextEditor"){
        xmlText = editor.getValue().trim();
    }
    else if(activeTab=="tabTreeEditor"){
        xmlText = updateTextEditor(editor, 'treeView');
        if(xmlText==0){
            xmlText = latestXmlText
        }
    }
    else if(activeTab=="tabSplitView"){
        xmlText = splitTextEditor.getValue().trim()
    }
    else if(data){
        xmlText = data.xml;
    }
    else{
        xmlText = latestXmlText
    }
    /* send ajax request with form data */
    beautify(xmlText);
    xmlText = beautifiedXmlText;
    var form = new FormData($("#githubPRForm")[0]);
    form.append("branchName", $("#branchName").val());
    form.append("updateUpstream", $("#updateUpstream").is(":checked"));
    form.append("fileName", $("#fileName").val());
    form.append("commitMessage", $("#commitMessage").val());
    form.append("prTitle", $("#prTitle").val());
    form.append("prBody", $("#prBody").val());
    form.append("xmlText", xmlText);
    $.ajax({
        type: "POST",
        enctype: 'multipart/form-data',
        url: "/app/make_pr/",
        processData: false,
        contentType: false,
        cache: false,
        dataType: 'json',
        timeout: 600000,
        data: form,
        success: function (data) {
            if(data.type=="success"){
                displayModal('<p>Your Pull Request was created successfully <a href="'+data.data+'">here</a></p>',"success");
            }
            $("#prOk").html('<span class="glyphicon glyphicon-ok"></span> Confirm');
            $("#prCancel").html('<span class="glyphicon glyphicon-remove"></span> Cancel');
            $("#prOk, #prCancel").prop('disabled', false);
        },
        error: function (e) {
            try {
                var obj = JSON.parse(e.responseText);
                if (obj.type=="pr_error"){
                    displayModal(obj.data, "error");
                }
                else if (obj.type=="auth_error"){
                    displayModal(obj.data, "alert");
                }
                else if (obj.type=="error"){
                    displayModal(obj.data, "error");
                }
            }
            catch (e){
                displayModal("The application could not be connected. Please try later.","error");
            }
            $("#prOk").html('<span class="glyphicon glyphicon-ok"></span> Confirm');
            $("#prCancel").html('<span class="glyphicon glyphicon-remove"></span> Cancel');
            $("#prOk, #prCancel").prop('disabled', false);
        }
    });
    return true;
}

function getCookie(name) {
    var value = "; " + document.cookie;
    var parts = value.split("; " + name + "=");
    if (parts.length == 2) return parts.pop().split(";").shift();
}


/* XML beautify script */
function beautify(text){
    csrf = getCookie('csrftoken');
    $.ajax({
        type: "POST",
        url: "/app/beautify/",
        dataType: 'json',
        timeout: 600000,
        async: false,
        data: {
            "xml" : text,
            "csrfmiddlewaretoken" : csrf,
        },
        success: function(data) {
            beautifiedXmlText = data.data.toString();
        },
        error: function (e) {
            try {
                //var obj = JSON.parse(e.responseText);
                console.log(e);
                //displayModal(obj.data, "error");
                beautifiedXmlText = text;
            }
            catch (e){
                console.log(e)
                displayModal(e,"error");
            }
        }
    });
}


