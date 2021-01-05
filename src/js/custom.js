import moment from 'moment';
import _ from 'lodash'

export const getTimeSaved = () => {
    const now = moment().format('MMMM DD, YYYY hh:mm:ss a');
    const label = `Date/Time Saved: ${now}`;
    return { now, label };
}

export const customizeField = function (field, fieldData, opts) {
    const $field = $(field)
    const $elem = $field.find(`#${fieldData.id}`);
    if ($elem.hasClass('customized')) return;
    $elem.addClass('customized');

    if (fieldData.type === 'file') {
        const $fileInput = $field.find('input[type="file"]');
        const div = $('<div></div>').insertAfter($fileInput);
        const btn = $('<button class="upload-files">Upload files</button>').appendTo(div);
        const uploadedFiles = $(`<div class="uploaded-files" ref="${fieldData.name}"></div>`).appendTo(div);
        const { userData } = fieldData;

        const addFile = (fileObj, container, upload = false) => {
            const addToContainer = (file) => {
                if (file) {
                    const fileUrlSplit = file.imageUrl.split('.')
                    const fileType = fileUrlSplit[fileUrlSplit.length -1]
                    // Possible JPEG and PNG formats supported by img tag.
                    const imageExt = ['jpg', 'jpeg', 'jfif', 'pjpeg', 'pjp', 'png', 'svg'];
                    const isFileAnImage = imageExt.includes(fileType)
                    const div = $('<div class="filebox"></div>').appendTo($(container));
                    $(`<a href="${file.imageUrl}" target="_blank" class="${isFileAnImage ? 'image-url' : ''}">${file.name}</a>`).appendTo(div);
                    const removeBtn = $('<div class="remove-icon">x</div>').appendTo(div);
                    removeBtn.click(() => $(div).remove());
                    if(isFileAnImage){
                        $(`<img src="${file.imageUrl}" class="form-image"></img>`).appendTo(div);
                    }
                }
            }
            const { fileUploadApi } = opts;
            if (upload && typeof fileUploadApi === 'function') {
                fileUploadApi(fileObj).then(file => addToContainer(file));
            } else {
                addToContainer(fileObj);
            }
        };

        if (userData) {
            for (const file of userData) {
                addFile(file, uploadedFiles);
            }
            userData.length = 0;
        }
        btn.click(() => $fileInput.val(null).click());

        $fileInput.change(() => {
            const inputFiles = $fileInput.prop('files');
            for (const fileObj of inputFiles) {
                addFile(fileObj, uploadedFiles, true);
            }
        });
    } else if (fieldData.type === 'paragraph' && fieldData.className === 'time-saved') {
        const timeSaved = getTimeSaved().label;
        $field.find('p.time-saved').text(timeSaved);
    } else if (fieldData.type === 'paragraph') {
        const { fileUploadApi } = opts;
        const formElements = $field.find('.form-elements');
        if (typeof fileUploadApi === 'function' && formElements.length !== 0) {
            if (formElements.hasClass('customized')) return;
            formElements.addClass('customized');

            // build elements
            const elm = $('<div class="form-group label-wrap"></div>');
            $('<label>Add Image</label>').appendTo(elm);
            const inputWrap = $('<div class="input-wrap"></div>').appendTo(elm);
            const fileInput = $('<input type="file">').appendTo(inputWrap);
            const uploadBtn =
                $(`<button class="button has-text-primary is-white is-transparent">
                <i class="fas fa-cloud-upload-alt fa-2x"></i>
            </button>`).appendTo(inputWrap);
            formElements.find('.label-wrap').after(elm);
            formElements.find('.subtype-wrap').hide();

            // event binding
            const txtInput = $field.find('div[contenteditable="true"]');

            const pasteHtmlAtCaret = function (html) {
                let sel;
                let range;
                if (window.getSelection) {
                    sel = window.getSelection();
                    if (sel.getRangeAt && sel.rangeCount) {
                        range = sel.getRangeAt(0);
                        range.deleteContents();
                        const el = document.createElement('div');
                        el.innerHTML = html;
                        const frag = document.createDocumentFragment();
                        let node;
                        let lastNode;
                        while ((node = el.firstChild)) {
                            lastNode = frag.appendChild(node);
                        }
                        range.insertNode(frag);

                        if (lastNode) {
                            range = range.cloneRange();
                            range.setStartAfter(lastNode);
                            range.collapse(true);
                            sel.removeAllRanges();
                            sel.addRange(range);
                        }
                    }
                } else if (document.selection && document.selection.type !== 'Control') {
                    document.selection.createRange().pasteHTML(html);
                }
            }

            uploadBtn.click(() => $(fileInput).click());

            fileInput.change(() => {
                const inputFiles = $(fileInput).prop('files');
                for (const fileObj of inputFiles) {
                    fileUploadApi(fileObj)
                        .then((file) => {
                            const imgHTML = `<img src="${file.imageUrl}">&nbsp;`;
                            txtInput.focus();
                            pasteHtmlAtCaret(imgHTML);

                            // update label
                            $field.find('label.field-label').html(txtInput.html());
                        })
                }
                $(fileInput).val(null);
            });
        }
    } else if (fieldData.type === 'checkbox-group' && fieldData.className === 'signature' && opts.userInfo) {
        const { userInfo } = opts;
        const signBox = $field.find('.formbuilder-checkbox');
        signBox.addClass('signbox');
        if (userInfo.signatureUrl) {
            signBox.append(`<img src="${userInfo.signatureUrl}"/>`);
            signBox.append(`<i>(${userInfo.name})</i>`);
        } else {
            signBox.append(`<span class="signedby">Signed by: ${userInfo.name}</span>`);
            signBox.append(`<a href="${userInfo.accountUrl}" target="_blank">Add a signature image</a>`);
        }
    } else if (fieldData.type === 'checkbox-group' && fieldData.required && fieldData.other && fieldData.userData) {
        const otherValue = _.difference(fieldData.userData, _.map(fieldData.values, 'value'));
        if (otherValue && otherValue.length > 0) {
            $field.find(`#${fieldData.name}-other`).prop('checked', true);
            $field.find(`#${fieldData.name}-other-value`).val(otherValue[0]);
        }
    }
}
