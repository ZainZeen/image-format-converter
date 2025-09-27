class ImageConverter {
    constructor() {
        this.currentFiles = [];
        this.selectedFiles = new Set();
        this.convertedResults = [];
        this.isBatchMode = false;
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.selectBtn = document.getElementById('selectBtn');
        this.previewSection = document.getElementById('previewSection');
        this.imagePreview = document.getElementById('imagePreview');
        this.fileCount = document.getElementById('fileCount');
        this.batchControls = document.getElementById('batchControls');
        this.selectAllBtn = document.getElementById('selectAllBtn');
        this.clearSelectionBtn = document.getElementById('clearSelectionBtn');
        this.selectedCount = document.getElementById('selectedCount');
        this.outputFormat = document.getElementById('outputFormat');
        this.quality = document.getElementById('quality');
        this.qualityValue = document.getElementById('qualityValue');
        this.qualityGroup = document.getElementById('qualityGroup');
        this.resize = document.getElementById('resize');
        this.scaleGroup = document.getElementById('scaleGroup');
        this.scaleValue = document.getElementById('scaleValue');
        this.customSizeGroup = document.getElementById('customSizeGroup');
        this.convertBtn = document.getElementById('convertBtn');
        this.batchConvertBtn = document.getElementById('batchConvertBtn');
        this.conversionInfo = document.getElementById('conversionInfo');
        this.infoContent = document.getElementById('infoContent');
        this.resultSection = document.getElementById('resultSection');
        this.resultPreview = document.getElementById('resultPreview');
        this.resultCount = document.getElementById('resultCount');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.newConvertBtn = document.getElementById('newConvertBtn');
    }

    bindEvents() {
        // 拖拽事件
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', () => {
            this.dropZone.classList.remove('drag-over');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                this.handleFiles(files);
            }
        });

        // 文件选择事件
        this.selectBtn.addEventListener('click', () => {
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const files = Array.from(e.target.files);
                this.handleFiles(files);
            }
        });

        // 格式选择事件
        this.outputFormat.addEventListener('change', () => {
            this.toggleQualityOption();
        });

        // 质量滑块事件
        this.quality.addEventListener('input', (e) => {
            this.qualityValue.textContent = e.target.value;
        });

        // 调整大小选项事件
        this.resize.addEventListener('change', () => {
            this.toggleResizeOptions();
        });

        // 批量控制事件
        this.selectAllBtn.addEventListener('click', () => {
            this.selectAllFiles();
        });

        this.clearSelectionBtn.addEventListener('click', () => {
            this.clearSelection();
        });

        // 转换按钮事件
        this.convertBtn.addEventListener('click', () => {
            this.convertImage();
        });

        this.batchConvertBtn.addEventListener('click', () => {
            this.batchConvertImages();
        });

        // 下载按钮事件
        this.downloadBtn.addEventListener('click', () => {
            this.downloadImage();
        });

        this.downloadAllBtn.addEventListener('click', () => {
            this.downloadAllImages();
        });

        // 新转换按钮事件
        this.newConvertBtn.addEventListener('click', () => {
            this.resetConverter();
        });
    }

    handleFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            alert('请选择图片文件！');
            return;
        }

        if (imageFiles.length !== files.length) {
            alert(`已过滤掉 ${files.length - imageFiles.length} 个非图片文件`);
        }

        this.currentFiles = imageFiles;
        this.selectedFiles.clear();
        this.isBatchMode = imageFiles.length > 1;
        
        this.loadImages();
    }

    async loadImages() {
        const imagePromises = this.currentFiles.map(file => this.loadImage(file));
        const images = await Promise.all(imagePromises);
        this.showPreview(images);
    }

    loadImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    resolve({
                        file: file,
                        src: e.target.result,
                        image: img,
                        size: file.size,
                        format: file.type.split('/')[1].toUpperCase(),
                        dimensions: {
                            width: img.width,
                            height: img.height
                        }
                    });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    showPreview(images) {
        this.fileCount.textContent = `(${images.length} 个文件)`;
        
        if (this.isBatchMode) {
            this.batchControls.style.display = 'flex';
            this.batchConvertBtn.style.display = 'inline-block';
            this.convertBtn.style.display = 'none';
        } else {
            this.batchControls.style.display = 'none';
            this.batchConvertBtn.style.display = 'none';
            this.convertBtn.style.display = 'inline-block';
        }

        this.imagePreview.innerHTML = images.map((imgData, index) => `
            <div class="image-item" data-index="${index}">
                <input type="checkbox" class="image-item-checkbox" id="checkbox-${index}">
                <img src="${imgData.src}" alt="预览图片">
                <div class="image-item-info">
                    <p><strong>${imgData.file.name}</strong></p>
                    <p>格式: ${imgData.format}</p>
                    <p>大小: ${this.formatFileSize(imgData.size)}</p>
                    <p>尺寸: ${imgData.dimensions.width} × ${imgData.dimensions.height}</p>
                </div>
            </div>
        `).join('');

        // 绑定点击事件
        this.imagePreview.addEventListener('click', (e) => {
            const imageItem = e.target.closest('.image-item');
            if (imageItem) {
                const index = parseInt(imageItem.dataset.index);
                this.toggleFileSelection(index);
            }
        });

        this.previewSection.style.display = 'block';
        this.toggleQualityOption();
        this.updateSelectedCount();
    }

    toggleQualityOption() {
        const format = this.outputFormat.value;
        const lossyFormats = ['jpeg', 'webp'];
        this.qualityGroup.style.display = lossyFormats.includes(format) ? 'block' : 'none';
    }

    toggleResizeOptions() {
        const resizeType = this.resize.value;
        this.scaleGroup.style.display = resizeType === 'scale' ? 'block' : 'none';
        this.customSizeGroup.style.display = resizeType === 'custom' ? 'block' : 'none';
    }

    toggleFileSelection(index) {
        if (this.selectedFiles.has(index)) {
            this.selectedFiles.delete(index);
        } else {
            this.selectedFiles.add(index);
        }
        
        const imageItem = document.querySelector(`[data-index="${index}"]`);
        const checkbox = imageItem.querySelector('.image-item-checkbox');
        
        if (this.selectedFiles.has(index)) {
            imageItem.classList.add('selected');
            checkbox.checked = true;
        } else {
            imageItem.classList.remove('selected');
            checkbox.checked = false;
        }
        
        this.updateSelectedCount();
    }

    selectAllFiles() {
        this.selectedFiles.clear();
        for (let i = 0; i < this.currentFiles.length; i++) {
            this.selectedFiles.add(i);
            const imageItem = document.querySelector(`[data-index="${i}"]`);
            const checkbox = imageItem.querySelector('.image-item-checkbox');
            imageItem.classList.add('selected');
            checkbox.checked = true;
        }
        this.updateSelectedCount();
    }

    clearSelection() {
        this.selectedFiles.clear();
        document.querySelectorAll('.image-item').forEach(item => {
            item.classList.remove('selected');
            item.querySelector('.image-item-checkbox').checked = false;
        });
        this.updateSelectedCount();
    }

    updateSelectedCount() {
        this.selectedCount.textContent = `已选择 ${this.selectedFiles.size} 个文件`;
    }

    async convertImage() {
        if (this.isBatchMode) {
            await this.batchConvertImages();
            return;
        }

        if (this.currentFiles.length === 0) return;

        const imageData = await this.loadImage(this.currentFiles[0]);
        const result = await this.convertSingleImage(imageData);
        
        this.convertedResults = [result];
        this.showConversionInfo(result);
        this.showResult([result]);
    }

    async batchConvertImages() {
        if (this.selectedFiles.size === 0) {
            alert('请先选择要转换的文件！');
            return;
        }

        const selectedIndices = Array.from(this.selectedFiles);
        const selectedFiles = selectedIndices.map(index => this.currentFiles[index]);
        
        this.convertBtn.disabled = true;
        this.batchConvertBtn.disabled = true;
        this.batchConvertBtn.textContent = '转换中...';

        try {
            const results = [];
            for (let i = 0; i < selectedFiles.length; i++) {
                const imageData = await this.loadImage(selectedFiles[i]);
                const result = await this.convertSingleImage(imageData);
                results.push(result);
                
                // 更新进度
                this.batchConvertBtn.textContent = `转换中... (${i + 1}/${selectedFiles.length})`;
            }

            this.convertedResults = results;
            this.showBatchConversionInfo(results);
            this.showResult(results);
        } finally {
            this.convertBtn.disabled = false;
            this.batchConvertBtn.disabled = false;
            this.batchConvertBtn.textContent = '批量转换选中文件';
        }
    }

    async convertSingleImage(imageData) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 计算新尺寸
        const newDimensions = this.calculateNewDimensions(imageData.dimensions);
        canvas.width = newDimensions.width;
        canvas.height = newDimensions.height;

        // 绘制图片
        ctx.drawImage(imageData.image, 0, 0, newDimensions.width, newDimensions.height);

        // 转换格式
        const outputFormat = this.outputFormat.value;
        const quality = this.quality.value / 100;

        let mimeType = 'image/png';
        let fileExtension = 'png';

        switch (outputFormat) {
            case 'jpeg':
                mimeType = 'image/jpeg';
                fileExtension = 'jpg';
                break;
            case 'webp':
                mimeType = 'image/webp';
                fileExtension = 'webp';
                break;
            case 'bmp':
                mimeType = 'image/bmp';
                fileExtension = 'bmp';
                break;
            case 'gif':
                mimeType = 'image/gif';
                fileExtension = 'gif';
                break;
        }

        // 转换为Blob
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, mimeType, quality);
        });

        return {
            originalFile: imageData.file,
            originalSize: imageData.size,
            originalFormat: imageData.format,
            originalDimensions: imageData.dimensions,
            blob: blob,
            newSize: blob.size,
            newDimensions: newDimensions,
            outputFormat: outputFormat,
            fileExtension: fileExtension,
            src: URL.createObjectURL(blob)
        };
    }

    calculateNewDimensions(originalDimensions) {
        const resizeType = this.resize.value;
        let { width, height } = originalDimensions;

        switch (resizeType) {
            case 'scale':
                const scale = this.scaleValue.value / 100;
                width = Math.round(width * scale);
                height = Math.round(height * scale);
                break;
            case 'custom':
                const customWidth = parseInt(this.customWidth.value);
                const customHeight = parseInt(this.customHeight.value);
                if (customWidth > 0) width = customWidth;
                if (customHeight > 0) height = customHeight;
                break;
        }

        return { width, height };
    }

    showConversionInfo(result) {
        const sizeChange = ((result.newSize - result.originalSize) / result.originalSize * 100).toFixed(1);
        const sizeChangeText = sizeChange > 0 ? `增加 ${sizeChange}%` : `减少 ${Math.abs(sizeChange)}%`;

        const formatInfo = this.getFormatInfo(result.originalFormat, result.outputFormat);
        
        this.infoContent.innerHTML = `
            <div class="info-item">
                <strong>格式转换：</strong>${result.originalFormat} → ${result.outputFormat.toUpperCase()}
            </div>
            <div class="info-item">
                <strong>文件大小：</strong>${this.formatFileSize(result.originalSize)} → ${this.formatFileSize(result.newSize)} (${sizeChangeText})
            </div>
            <div class="info-item">
                <strong>图片尺寸：</strong>${result.originalDimensions.width}×${result.originalDimensions.height} → ${result.newDimensions.width}×${result.newDimensions.height}
            </div>
            <div class="info-item">
                <strong>压缩特性：</strong>${formatInfo.compression}
            </div>
            <div class="info-item">
                <strong>质量特性：</strong>${formatInfo.quality}
            </div>
            <div class="info-item">
                <strong>透明度支持：</strong>${formatInfo.transparency}
            </div>
            <div class="info-item">
                <strong>适用场景：</strong>${formatInfo.usage}
            </div>
        `;
        this.conversionInfo.style.display = 'block';
    }

    showBatchConversionInfo(results) {
        const totalOriginalSize = results.reduce((sum, result) => sum + result.originalSize, 0);
        const totalNewSize = results.reduce((sum, result) => sum + result.newSize, 0);
        const totalSizeChange = ((totalNewSize - totalOriginalSize) / totalOriginalSize * 100).toFixed(1);
        const totalSizeChangeText = totalSizeChange > 0 ? `增加 ${totalSizeChange}%` : `减少 ${Math.abs(totalSizeChange)}%`;

        const formatInfo = this.getFormatInfo(results[0].originalFormat, results[0].outputFormat);
        
        this.infoContent.innerHTML = `
            <div class="info-item">
                <strong>批量转换：</strong>${results.length} 个文件
            </div>
            <div class="info-item">
                <strong>格式转换：</strong>${results[0].originalFormat} → ${results[0].outputFormat.toUpperCase()}
            </div>
            <div class="info-item">
                <strong>总文件大小：</strong>${this.formatFileSize(totalOriginalSize)} → ${this.formatFileSize(totalNewSize)} (${totalSizeChangeText})
            </div>
            <div class="info-item">
                <strong>平均压缩率：</strong>${totalSizeChangeText}
            </div>
            <div class="info-item">
                <strong>压缩特性：</strong>${formatInfo.compression}
            </div>
            <div class="info-item">
                <strong>质量特性：</strong>${formatInfo.quality}
            </div>
            <div class="info-item">
                <strong>透明度支持：</strong>${formatInfo.transparency}
            </div>
            <div class="info-item">
                <strong>适用场景：</strong>${formatInfo.usage}
            </div>
        `;
        this.conversionInfo.style.display = 'block';
    }

    getFormatInfo(fromFormat, toFormat) {
        const formatMap = {
            'jpeg': {
                compression: '有损压缩',
                quality: '适合照片，色彩丰富',
                transparency: '不支持',
                usage: '网页图片、照片存储'
            },
            'png': {
                compression: '无损压缩',
                quality: '质量最高，支持透明',
                transparency: '支持',
                usage: '图标、图形、需要透明的图片'
            },
            'webp': {
                compression: '现代有损/无损压缩',
                quality: '压缩率高，质量好',
                transparency: '支持',
                usage: '现代网页，替代JPEG/PNG'
            },
            'bmp': {
                compression: '无压缩',
                quality: '质量最高，文件最大',
                transparency: '不支持',
                usage: '专业图像处理，打印'
            },
            'gif': {
                compression: '有损压缩，256色',
                quality: '色彩有限，支持动画',
                transparency: '支持',
                usage: '简单图形、动画'
            }
        };

        return formatMap[toFormat] || formatMap['png'];
    }

    showResult(results) {
        this.resultCount.textContent = `(${results.length} 个文件)`;
        
        if (results.length === 1) {
            this.resultPreview.innerHTML = `
                <img src="${results[0].src}" alt="转换结果">
                <div class="result-info">
                    <p><strong>转换完成！</strong></p>
                    <p>新文件大小：${this.formatFileSize(results[0].newSize)}</p>
                </div>
            `;
            this.downloadBtn.style.display = 'inline-block';
            this.downloadAllBtn.style.display = 'none';
            this.downloadBtn.onclick = () => this.downloadImage(results[0].blob, results[0].fileExtension, results[0].originalFile.name);
        } else {
            this.resultPreview.innerHTML = `
                <div class="batch-result-grid">
                    ${results.map((result, index) => `
                        <div class="result-item">
                            <img src="${result.src}" alt="转换结果">
                            <div class="result-item-info">
                                <p><strong>${result.originalFile.name}</strong></p>
                                <p>大小: ${this.formatFileSize(result.newSize)}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="result-info">
                    <p><strong>批量转换完成！</strong></p>
                    <p>共转换 ${results.length} 个文件</p>
                </div>
            `;
            this.downloadBtn.style.display = 'none';
            this.downloadAllBtn.style.display = 'inline-block';
            this.downloadAllBtn.onclick = () => this.downloadAllImages(results);
        }
        
        this.resultSection.style.display = 'block';
    }

    downloadImage(blob, fileExtension, originalName) {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        if (originalName) {
            const nameWithoutExt = originalName.replace(/\.[^/.]+$/, "");
            a.download = `${nameWithoutExt}_converted.${fileExtension}`;
        } else {
            a.download = `converted_image.${fileExtension}`;
        }
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async downloadAllImages(results) {
        if (!results) results = this.convertedResults;
        
        // 使用JSZip库来创建ZIP文件
        if (typeof JSZip === 'undefined') {
            // 如果没有JSZip，则逐个下载
            for (const result of results) {
                await new Promise(resolve => setTimeout(resolve, 100)); // 避免浏览器阻止多个下载
                this.downloadImage(result.blob, result.fileExtension, result.originalFile.name);
            }
            return;
        }

        const zip = new JSZip();
        
        results.forEach((result, index) => {
            const nameWithoutExt = result.originalFile.name.replace(/\.[^/.]+$/, "");
            const fileName = `${nameWithoutExt}_converted.${result.fileExtension}`;
            zip.file(fileName, result.blob);
        });

        const zipBlob = await zip.generateAsync({type: "blob"});
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `converted_images_${new Date().getTime()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    resetConverter() {
        this.currentFiles = [];
        this.selectedFiles.clear();
        this.convertedResults = [];
        this.isBatchMode = false;
        
        this.previewSection.style.display = 'none';
        this.conversionInfo.style.display = 'none';
        this.resultSection.style.display = 'none';
        this.fileInput.value = '';
        
        // 清理所有创建的URL
        this.convertedResults.forEach(result => {
            if (result.src) {
                URL.revokeObjectURL(result.src);
            }
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// 初始化转换器
document.addEventListener('DOMContentLoaded', () => {
    new ImageConverter();
});
