//v2.0
(function($) {
    "use strict";
    $.support.cors = true;
    var imagecropper = function(element, options) {
        var self = this;
        self.e = $(element);
        self.o = $.extend({}, $.fn.imagecropper.defaults, options);
        self.r = window.FileReader || false;

        if (self.r) {
            self.createInput();
            self.events();
                        
            if (self.o.drop) {
                self.e.on('dragenter dragover dragleave drop', function() {             
                    return false;
                });
            }
            
            if (self.o.crop) {
                self.createModal();
            } 
            
            if (self.o.ratio.length) {
                var ratio = self.o.ratio[0].split('/');
                self.ratio = parseInt(ratio[0]) / parseInt(ratio[1])
                
                for (var i = 0; i < self.o.ratio.length; i++) {
                    ratio = self.o.ratio[i].split('/');

                    self.modalHeader.append(
                        $('<input type="button">').data({ratio: parseInt(ratio[0]) / parseInt(ratio[1])}).val(ratio.toString()).attr(i == 0 ? {disabled: 'disabled'} : {})
                    )
                } 
                
                self.modalHeader.delegate('input[type="button"]:not(:disabled)', 'click', function() {
                    self.ratio = $(this).data().ratio;
                    self.modalHeader.find('input[type="button"]').removeAttr('disabled')
                    $(this).attr({disabled: 'disabled'})
                    /*
                    if (self.ratio > 1) {
                        self.selection.w = Math.floor(self.canvas.width() / 2);
                        self.selection.h = Math.floor(self.selection.w / self.ratio);
                    } else {
                        self.selection.h = Math.floor(self.canvas.height() / 2);
                        self.selection.w = Math.floor(self.selection.h * self.ratio);
                    }
                    
                    self.selection.x = Math.floor((self.canvas.width() - self.selection.w) / 2);
                    self.selection.y = Math.floor((self.canvas.height() - self.selection.h) / 2);

                    var c = self.selection.xywh()
                    self.updateCanvas(c.x, c.y, c.w, c.h, self.canvas, self.ctx)
                    self.createCorners();
                    */
                    self.setSelect(self.ratio);
                })
            }
            
            self.scaleX = 1;
            self.scaleY = 1;
        } else {
            throw new Error('Oh! Sorry, FileReader not supported by the browser');
        }
    };
    
    imagecropper.prototype = {
        
        constructor: imagecropper,
        
        events: function(from, to) {
            var self = this;
            self.e.on('mouseover', function() {         
                copyLayout(self.e[0], self.div.css('visibility', 'visible'));
            });
        },
        
        createInput: function() {   
            var self = this;
    		self.input = $('<input>').attr('type', 'file').css({
                'position' : 'absolute',
                'right' : 0,
                'margin' : 0,
                'padding' : 0,
                'height' : '100%',
                'fontSize' : '480px',
                'fontFamily' : 'sans-serif',
                'cursor' : 'pointer'
    		});
            self.div = $('<div>').css({
                'display' : 'block',
                'position' : 'absolute',
                'overflow' : 'hidden',
                'margin' : 0,
                'padding' : 0,                
                'opacity' : 0,
                'direction' : 'ltr',
                'zIndex': 2147483581 //maximum = 2147483583
            });
            
            if (self.o.multiple) {
                self.input.attr('multiple', 'multiple');
            }

    		if (self.div.css('opacity') !== '0') {
                if (typeof(self.div.context.filters) == 'undefined'){
                    throw new Error('Opacity not supported by the browser');
                }
                self.div.css('filter', 'alpha(opacity=0)');
            }   
            
            self.input.change(function() {
                if (!self.input || self.input.val() === '') {   
                    return;                
                }
                self.getFiles(this.files);
            }).mouseover(function() {
                self.e.addClass(self.o.hoverClass);
            }).mouseout(function() {
                self.e.removeClass(self.o.hoverClass);
                self.e.removeClass(self.o.focusClass);
            }).focus(function() {
                self.e.addClass(self.o.focusClass);
            }).blur(function() {
                self.e.removeClass(self.o.focusClass);
            })
            
	        $('body').append(this.div.append(this.input));
        },
        
        getFiles: function(files) {
            var self = this, i, len = files.length, reader;
            
            self.images = [];
            self.s = 0;

            for (i = 0; i < len; i++) {
                if (!files[i].type.match(/image.*/)) {
                    return;
                }
                reader = new FileReader();
                reader.readAsDataURL(files[i]);
                
                (function(i) {
                    reader.onload = function(e) {
                        self.file = fileFromPath(files[i].name);
                        
                        var img = new Image();
                        img.src = e.target.result;
                        img.onload = function() {
                            setTimeout(function() {
                                var size = getSize(img.width, img.height, self.o.maxWidth, self.o.maxHeight);
                                    
                                self.width  = img.width;
                                self.height = img.height;
                                                               
                                self.images.push({
                                    img: img, 
                                    name: files[i].name, 
                                    type: files[i].type, 
                                    size: files[i].size
                                });
                                
                                if (i == 0 && self.o.crop) {
                                    self.showModal();
                                } else if (!self.o.crop) {
                                    self.upload(img.src);
                                }
                                
                                self.o.onChange(self.file, getExt(self.file), self.render = e.target.result);
                            }, 1)
                        }
                    }
                })(i);
            }      
        },
        
        crop: function() {
            var self = this, s = self.selection, canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');

            canvas.width = s.w * self.scaleX;
            canvas.height = s.h * self.scaleY;
            
            ctx.drawImage(self.img, s.x * self.scaleX, s.y * self.scaleY, s.w * self.scaleX, s.h * self.scaleY, 0, 0, s.w * self.scaleX, s.h * self.scaleY);
            return canvas.toDataURL(self.type);
        },
        
        createModal: function() {
            var self = this, c;
            
            self.modal = $('<div>', {'class': 'imagecropper_modal fade'}).append(
                self.modalHeader = $('<div>', {'class': 'imagecropper_header'}).append(
                    $('<div>', {'class': 'imagecropper_close'}).text('×').click(function() {
                        self.hideModal()
                    }),
                    $('<h3>', {'class': 'imagecropper_title'}).text('Cropping image'),
                    self.setWidth = $('<input>', {'type':'text', 'placeholder':'width'}),
                    self.setHeight = $('<input>', {'type':'text', 'placeholder':'height'})
                ),
                $('<div>', {'class': 'imagecropper_content'}).append(
                    self.canvas = $('<canvas>')
                ),
                $('<div>', {'class': 'imagecropper_footer'}).append(
                    self.buttonNo = $('<button>', {'class': 'imagecropper_no'}).text('Skip'),
                    self.buttonOk = $('<button>', {'class': 'imagecropper_ok'}).text('Crop')
                )
            );
            
            self.backdrop = $('<div>', {'class': 'imagecropper_backdrop fade'}).click(function() {
                self.hideModal();
            });
            
            $('body').append(self.modal);
            
            self.setWidth.on('keyup change', function() {
                if ($(this).val() > 10) {
                    self.selection.w = $(this).val() / self.scaleX;
                }
                if (self.selection.x + self.selection.w >= self.canvas[0].width) {
                     $(this).val(self.selection.w = self.canvas[0].width - self.selection.x)
                }
                c = self.selection.xywh()
                self.updateCanvas(c.x, c.y, c.w, c.h, self.canvas, self.ctx)
            });
            self.setHeight.on('keyup change', function() {
                if ($(this).val() > 10) {
                    self.selection.h = $(this).val() / self.scaleY;
                }
                if (self.selection.y + self.selection.h >= self.canvas[0].height) {
                     $(this).val(self.selection.h = self.canvas[0].height - self.selection.y)
                }
                c = self.selection.xywh()
                self.updateCanvas(c.x, c.y, c.w, c.h, self.canvas, self.ctx)
            });
            
            self.buttonOk.on('click', function() {   
                self.upload(self.crop());
                self.check();
            });
            
            self.buttonNo.on('click', function() {
                self.upload(self.img.src);
                self.check();
            });
        },
        
        showModal: function() {           
            this.modal.addClass('in');
            $('body').append(this.backdrop.addClass('in').show());
            
            this.createCanvas();
            this.setSelect();
        },
        
        hideModal: function() {
            var self = this;
            self.modal.animate({width: 560, marginLeft: -560/2}).removeClass('in').find('.imagecropper-content').height(200);
            self.backdrop.removeClass('in').hide();
            self.s = 0;
            self.images = [];
        },
        
        createCanvas: function() {
            var self = this;
            self.ctx = self.canvas[0].getContext('2d');

            self.img = self.images[self.s].img;
            self.type = self.images[self.s].type;
            self.result = [];
                
            var img = self.img; 

            self.scale_size = false;
            
            if (img.width > $(window).width()-150 || img.height > $(window).height()-150) {
                self.scale_size = getSize(img.width, img.height, $(window).width()-150, $(window).height()-150);
                
                self.scaleX = img.width / self.scale_size.width;
                self.scaleY = img.height / self.scale_size.height;

                img.width = self.scale_size.width;
                img.height = self.scale_size.height;
            }
            
            self.modal.css({
                width: self.scale_size ? self.scale_size.width + parseInt(self.modal.find('.imagecropper_content').css('padding-left')) * 2 : img.width + parseInt(self.modal.find('.imagecropper_content').css('padding-left')) * 2
            }).animate({
                marginLeft: self.scale_size ? -(self.scale_size.width/2) : -(img.width/2),
                marginTop: self.scale_size ? -(self.scale_size.height/2)-60 : -(img.height/2)-60
            }).find('.imagecropper_content').animate({
                height: self.scale_size ? self.scale_size.height : img.height
            })
            
            self.canvas[0].width = img.width;
            self.canvas[0].height = img.height;
        },
        
        setSelect: function() {
            var self = this;
            if (self.o.ratio.length) {
                if (self.ratio > 1) {
                    self.moveW = Math.floor(self.canvas.width() / 2);
                    self.moveH = Math.floor(self.moveW / self.ratio);
                } else {
                    self.moveH = Math.floor(self.canvas.height() / 2);
                    self.moveW = Math.floor(self.moveH * self.ratio);
                }

                self.initX = Math.floor((self.canvas.width() - self.moveW) / 2);
                self.initY = Math.floor((self.canvas.height() - self.moveH) / 2);
            } else {
                self.initX = Math.floor(self.canvas.width() / 4);
                self.initY = Math.floor(self.canvas.height() / 4);
                self.moveW = Math.floor(self.canvas.width() / 2);
                self.moveH = Math.floor(self.canvas.height() / 2);
            }
            self.selection = new self.rect(self.initX, self.initY, self.moveW, self.moveH, 3);
            self.updateCanvas(self.initX, self.initY, self.moveW, self.moveH);
            self.createCorners();
            self.canvasEvents();
        },
        
        drawSelect: function(x, y, w, h) {
            var self = this, ctx = self.ctx, img = self.img, 
                
                ratio_x = img.width / self.width, 
                ratio_y = img.height / self.height, 
                
                mn_x = self.width / img.width, 
                mn_y = self.height / img.height;
                             
            ctx.save();
            ctx.scale(ratio_x, ratio_y);
            ctx.drawImage(img, 
                            x * mn_x, y * mn_y, w * mn_x, h * mn_y, 
                            x * mn_x, y * mn_y, w * mn_x, h * mn_y);
            ctx.restore();
        },
        
        updateCanvas: function(x, y, w, h) {
            var self = this, c = self.canvas[0], ctx = self.ctx;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.clearRect(0, 0, c.width, c.height);
            ctx.drawImage(self.img, 0, 0, self.img.width, self.img.height);
            ctx.fillRect(0, 0, c.width, c.height);                      
            ctx.clearRect(x, y, w, h);  
            self.drawSelect(x, y, w, h);
        },
        
        createCorners: function() {
            var self = this,
                c = self.canvas[0], 
                ctx = self.ctx,
                point, r, i, 
                points = self.selection.points, 
                len = points.length;
    
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "rgba(0, 0, 0, 5)";
            self.corners = [];
            
            for (i = 0; i < len; i++) {
                point = points[i];
                r = new self.rect(point.x - 3, point.y - 3, 8, 8);
                r.parent = point;
                self.corners.push(r);
                ctx.fillRect(point.x - 3, point.y - 3, 8, 8);
                ctx.strokeRect(point.x - 3, point.y - 3, 8, 8);
            }
        },
        
        check: function() {
            var self = this;
            self.s++;
            if (self.images.length > self.s) {
                self.createCanvas();
                self.setSelect();
            } else {
                self.hideModal();
            }
        },
        
        canvasEvents: function() {
            var self = this, cords = {}, c;
                        
            self.canvas.mousedown(function(e) {
                cords = {
                    x: e.pageX - self.canvas.offset().left,
                    y: e.pageY - self.canvas.offset().top
                }
                
                if (self.selection.hasPoint(cords.x, cords.y)) {
                    self.dragStartX = cords.x;
                    self.dragStartY = cords.y;
                    
                    $(document).mousemove(function(e) {
                        cords = {
                            x: e.pageX - self.canvas.offset().left,
                            y: e.pageY - self.canvas.offset().top
                        }
                        
                        self.dragMoveW = cords.x - self.dragStartX;
                        self.dragMoveH = cords.y - self.dragStartY;

                        self.selection.drag(self.dragMoveW, self.dragMoveH, self.canvas);
                        c = self.selection.xywh2();
                        self.updateCanvas(c.x, c.y, c.w, c.h, self.canvas, self.ctx);
                    }).mouseup(function() {
                        $(document).unbind('mousemove mouseup');
                        
                        self.selection.renewPoints();
                        c = self.selection.xywh2();
                        self.updateCanvas(c.x, c.y, c.w, c.h, self.canvas, self.ctx);
                        self.createCorners();
                    })
                } else {
                    var corners = self.corners, len, i, points, point;
                    
                    for (i = 0, len = corners.length; i < len; i++) {
                        var corner = corners[i];
                        
                        if (corner.hasPoint(cords.x, cords.y)) {
                            points = self.selection.points;
                            
                            for (var k = 0; k < points.length; k++) {
                                point = points[k]
                                
                                if (point.x === corner.parent.x && point.y === corner.parent.y) {
                                    var p = $.inArray(point, self.selection.points)
                                    
                                    var resizeInitX = point.x
                                    var resizeInitY = point.y
  
                                    $(document).mousemove(function(e) {
                                        var c, x, y;
                                        
                                        cords = {
                                            x: e.pageX - self.canvas.offset().left,
                                            y: e.pageY - self.canvas.offset().top
                                        };
                                     
                                        if (cords.x > self.canvas.width()) {
                                            cords.x = self.canvas.width();
                                        }
                                        if (cords.y > self.canvas.height()) {
                                            cords.y = self.canvas.height();
                                        }
                                        if (cords.x < 1) {
                                            cords.x = 0;
                                        }
                                        if (cords.y < 1) {
                                            cords.y = 0;
                                        }   
                                        
                                        x = cords.x - resizeInitX;

                                        if (self.ratio) {
                                            switch (p) {
                                                case 0:
                                                    y = x/self.ratio;
                                                break;
                                                case 2:
                                                    y = x/self.ratio;
                                                break;
                                                case 1:
                                                    y = -1 * (x/self.ratio);
                                                break;
                                                case 3:
                                                    y = -1 * (x/self.ratio);
                                            }
                                        } else {
                                            y = cords.y - resizeInitY;
                                        }

                                        self.selection.translate(p, resizeInitX + x, resizeInitY + y, self.canvas);
                                        c = self.selection.xywh();
                                        self.updateCanvas(c.x, c.y, c.w, c.h, self.canvas, self.ctx);
                                        self.setWidth.val(Math.floor(c.w));
                                        self.setHeight.val(Math.floor(c.h));
                                    }).mouseup(function() {
                                        $(document).unbind('mousemove mouseup');
                                        self.createCorners();
                                    })
                                }
                            }
                        }
                    }
                }
            })
        },
        
        rect: function(x, y, w, h, p) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.padding = p;
            this.points = [
                {x: this.x, y: this.y}, 
                {x: this.x + this.w, y: this.y}, 
                {x: this.x + this.w, y: this.y + this.h}, 
                {x: this.x, y: this.y + this.h}
            ];
            this.newPoints = [];
            
            this.drag = function(x, y, canvas) {
                this.newx = this.x + x;
                this.newy = this.y + y;
                
                if (this.newx < 1) {
                    this.newx = 0;
                }
                if (this.newy < 1) {
                    this.newy = 0;
                }
                if (this.newx > canvas.width() - this.w) {
                    this.newx = canvas.width() - this.w;
                }
                if (this.newy > canvas.height() - this.h) {
                    this.newy = canvas.height() - this.h;
                }
                
                if (this.w < 0) {
                    if (this.newx - Math.abs(this.w) < 1) {
                        this.newx = Math.abs(this.w);
                    }
                    if (this.newx > canvas.width()) {
                        this.newx = canvas.width();
                    }
                }
                if (this.h < 0) {
                    if (this.newy - Math.abs(this.h) < 1) {
                        this.newy = Math.abs(this.h);
                    }
                    if (this.newy > canvas.height()) {
                        this.newy = canvas.height();
                    }
                }
            },
            
            this.xywh = function() {
                return {x: this.x, y: this.y, w: this.w, h: this.h};
            },
            
            this.xywh2 = function() {
                return {x: this.newx, y: this.newy, w: this.w, h: this.h};
            },
            
            this.hasPoint = function(x, y) {
                var max_x, max_y, min_x, min_y, padding, point1, point2;
                padding = this.padding || 0;
                point1 = this.points[0];
                point2 = this.points[2];
                if (point1.x < point2.x) {
                    min_x = point1.x;
                    max_x = point2.x;
                } else {
                    min_x = point2.x;
                    max_x = point1.x;
                }
                if (point1.y < point2.y) {
                    min_y = point1.y;
                    max_y = point2.y;
                } else {
                    min_y = point2.y;
                    max_y = point1.y;
                }
                if (x > (min_x + padding) && x < (max_x - padding) && y > (min_y + padding) && y < (max_y - padding)) {
                    return true;
                } else {
                    return false;
                }
            },
            
            this.translate = function(i, x, y, canvas) {
                var oldPoints = this.points, nx, ny, nw, nh, point = [{},{},{},{}];

                switch (i) {
                    case 0:                        
                        point[0] = {x: x, y: y};
                        point[1] = {x: oldPoints[1].x, y: y};
                        point[2] = {x: oldPoints[2].x, y: oldPoints[2].y};
                        point[3] = {x: x, y: oldPoints[3].y};
                    break;
                    case 1:
                        point[0] = {x: oldPoints[0].x, y: y};
                        point[1] = {x: x, y: y};
                        point[2] = {x: x, y: oldPoints[2].y};
                        point[3] = {x: oldPoints[3].x, y: oldPoints[3].y};
                    break;
                    case 2:
                        point[0] = {x: oldPoints[0].x, y: oldPoints[0].y};
                        point[1] = {x: x, y: oldPoints[1].y};
                        point[2] = {x: x, y: y};
                        point[3] = {x: oldPoints[3].x, y: y};
                    break;
                    case 3:
                        point[0] = {x: x, y: oldPoints[0].y};
                        point[1] = {x: oldPoints[1].x, y: oldPoints[1].y};
                        point[2] = {x: oldPoints[2].x, y: y};
                        point[3] = {x: x, y: y};
                }

                nx = point[0].x;
                ny = point[0].y;
                nw = point[2].x - point[0].x;
                nh = point[2].y - point[0].y;
                
                if (nw < 1 || nh < 1 || nw + nx > canvas.width() || nh + ny > canvas.height() || nx < 0 || ny < 0) {
                    return;
                }
                
                this.points[0] = point[0];
                this.points[1] = point[1];
                this.points[2] = point[2];
                this.points[3] = point[3];
                
                this.x = nx;
                this.y = ny;
                this.w = nw;
                this.h = nh;
            },
            
            this.renewPoints = function() {
                this.x = this.newx;
                this.y = this.newy;
                this.points = [
                    {x: this.x, y: this.y}, 
                    {x: this.x + this.w,y: this.y}, 
                    {x: this.x + this.w, y: this.y + this.h}, 
                    {x: this.x, y: this.y + this.h}
                ];
            }
        },
                
        upload: function(base64) {
            var self = this, post = {};
            
            post[self.o.name] = {};             
            post[self.o.name]['tmp'] = base64;
            post[self.o.name]['size'] = self.images[self.s].size;
            post[self.o.name]['name'] = self.images[self.s].name;
            post[self.o.name]['type'] = self.images[self.s].type;
            
            for (var val in self.o.data) {
    			post[val] = self.o.data[val]
    		}
            
            self.o.onSubmit(self.file, getExt(self.file), base64);

            $.post(self.o.url, post, function(response) {
                self.o.onComplete(self.e, self.file, response, base64);
            });
        }
    }
    
    //init plugin
    $.fn.imagecropper = function(options) {
        return this.each(function () {
            var self = $(this), data = self.data('imagecropper');
            if (!data) {
                self.data('imagecropper', (data = new imagecropper(this, options)));
            }
        })
    };
    
    //defaults options
    $.fn.imagecropper.defaults = {
        url: '/upload.php',
        name: 'file',
        multiple: false,
        ratio: [],
        data: {},
        drop: false,
        crop: true,
        maxWidth: false,
        maxHeight: false,
        hoverClass: 'hover',
        focusClass: 'focus',
        onChange: function(){},
        onSubmit: function(){},
        onComplete: function(){}
    };
    
    //function
    function copyLayout(from, to) {
	    var box = getBox(from);
        
        to.css({
            position: 'absolute',                    
	        left : box.left,
	        top : box.top,
	        width : from.offsetWidth,
	        height : from.offsetHeight
        });
    }
    function getBox(el) {
        var offset = getOffset(el);
        return {left: offset.left, right: offset.left + el.offsetWidth, top: offset.top, bottom: offset.top + el.offsetHeight};
    }
    function getOffset(el) {
        if (document.documentElement.getBoundingClientRect) {
            var box = el.getBoundingClientRect(),
                doc = el.ownerDocument,
                body = doc.body,
                docElem = doc.documentElement, // for ie 
                clientTop = docElem.clientTop || body.clientTop || 0,
                clientLeft = docElem.clientLeft || body.clientLeft || 0;
             
            var zoom = 1;     
                   
            if (body.getBoundingClientRect) {
                var bound = body.getBoundingClientRect();
                zoom = (bound.right - bound.left) / body.clientWidth;
            }
            if (zoom > 1) {
                clientTop = 0;
                clientLeft = 0;
            }
            var top = box.top / zoom + (window.pageYOffset || docElem && docElem.scrollTop / zoom || body.scrollTop / zoom) - clientTop, 
                left = box.left / zoom + (window.pageXOffset || docElem && docElem.scrollLeft / zoom || body.scrollLeft / zoom) - clientLeft;
                
            return {top: top, left: left};
        } else {
            var top = 0, left = 0;

            top += el.offsetTop || 0;
            left += el.offsetLeft || 0;
            el = el.offsetParent;
            
            return {left: left, top: top};
        }
    }
    function fileFromPath(file) {
    	return file.replace(/.*(\/|\\)/, "");			
    }
    function getSize(width, height, maxWidth, maxHeight) {
        if (maxWidth && maxHeight) {
            var w = width / maxWidth;
            var h = height / maxHeight;
            
            return w > h ? {width: maxWidth, height: height / w} : {width: width / h, height: maxHeight};
        }
        if (maxWidth) {
            var w = width / maxWidth;
            return {width: maxWidth, height: height / w};
        }
        if (maxHeight) {
            var h = height / maxHeight;
            return {width: width / h, height: maxHeight};
        }
        return {width: width, height: height};
    }
    function getExt(file) {
    	return (/[.]/.exec(file)) ? /[^.]+$/.exec(file.toLowerCase()) : '';
    }
})(jQuery);