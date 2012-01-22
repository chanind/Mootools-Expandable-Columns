var ExpandableColumns = new Class({
	Implements: [Options, Events],
	options: {
		//height: 300,
		//width: 950
		initialWidths: [], //[100, 150, etc...]
		columnClass: 'column',
		resizeHandleClass: 'resize',
		minColumnWidth: 20,
		totalTicks: 100,
		snap: false
		
	},
	initialize: function(container, options){
		this.container = $(container);
		this.setOptions(options);
		this.isContainerFull = false;
		this.options.height = (this.options.height || this.container.getSize().y) + 'px';
		this.options.width = (this.options.width || this.container.getSize().x) + 'px';
		this.container.setStyles({
			position: 'relative', 
			width: this.options.width, 
			height: this.options.height
		});
		this.columns = this.container.getChildren();
		this.initializedColumns = [];
		this.columns.each(function(column, i){ this.$initColumn(column, i) }, this);
		this.columns.each(function(column, i){ this.$setupDragHandle(column, i) }, this);
	},
	getColumnBands: function(){
		var bands = [this.options.totalTicks]; 
		var columnTicks = this.columns.map(function(column){
			return Math.round(this.options.totalTicks * Number.from(column.getStyle('right')) / Number.from(this.options.width));
		}, this);
		return bands.concat(columnTicks);
	},
	appendColumn: function(column){
		column = $(column).inject(this.container);
		this.columns.push(column);
		this.$initColumn(column);
		this.$setupDragHandle(column);
		this.$equalizeFinalColumns();
	},
	popColumn: function(){
		if (this.columns.length > 1){
			var lastCol = this.columns.getLast();
			var lastColWidth = lastCol.getComputedSize().totalWidth;
			this.columns.erase(lastCol);
			this.initializedColumns.erase(lastCol);
			lastCol.destroy();
			var newLastCol = this.columns.getLast();
			var newLastColWidth = newLastCol.getComputedSize().width;
			newLastCol.setStyles({
				width: newLastColWidth + lastColWidth + 'px',
				right: 0
			});
		}
	},
	$initColumn: function(column, i){
		if (i == null) i = this.columns.length - 1;
		var width = (this.options.initialWidths[i] || Math.ceil(this.$containerWidth() / this.columns.length)) + 'px';
		column.setStyles({
			position: 'absolute',
			width: width,
			height: this.options.height,
			right: 0,
			top: 0,
			display: 'block'
		});
		column.addClass(this.options.columnClass);
		this.initializedColumns.push(column);
		if (i != 0){
			this.$repositionLeftColumns(i);
		}
	},
	$setupDragHandle: function(column, i){
		if (i == null) i = this.columns.length - 1;
		if (i > 0){
			var handle = new Element('div', {'class': this.options.resizeHandleClass}).inject(column);
			var leftColumn = this.columns[i - 1];
			column.makeResizable({
				handle: handle,
				grid: this.options.snap,
				invert: true,
				modifiers: {x : 'width', y: false},
				limit: {x: [this.options.minColumnWidth, null]},
				onStart: function() {
					var colSize = column.getComputedSize();
					var expandableColspan = colSize.totalWidth + leftColumn.getComputedSize().totalWidth;
					var paddingAndBorder = colSize.totalWidth - colSize.width;
					this.maxDragWidth = expandableColspan - this.options.minColumnWidth - paddingAndBorder;
					this.fireEvent('dragStart');
				}.bind(this),
				onDrag: function() {
					if(column.getWidth() > this.maxDragWidth) {
						column.setStyle("width", this.maxDragWidth);
					}
					this.$stretchToMatch(leftColumn, column);
					this.fireEvent('drag');
				}.bind(this),
				onComplete: this.fireEvent.bind(this, 'dragEnd'),
				onCancel: this.fireEvent.bind(this, 'dragEnd')
			});
		}
	},
	$getTotalColumnWidths: function(columns){
		return columns.map(function(col){ return col.getComputedSize().totalWidth }).sum();
	},
	$repositionLeftColumns: function(colIndex){
		var column = this.columns[colIndex];
		var colWidth = column.getComputedSize().totalWidth;
		var leftColumns = this.initializedColumns.slice(0, colIndex);
		var rightColumns = this.initializedColumns.slice(colIndex + 1);
		var rightOffset = this.$getTotalColumnWidths(rightColumns);
		column.setStyle('right', rightOffset + 'px');
		var columnLeftCornerX = this.$containerWidth() - (rightOffset + colWidth);
		if (columnLeftCornerX < 0) this.isContainerFull = true;
		if (this.isContainerFull){
			var nextElementBoundaryX = this.$getTotalColumnWidths(leftColumns);
			var currentWidth = column.getSize().x;
			var idealWidth = currentWidth + columnLeftCornerX - nextElementBoundaryX;
			if (idealWidth > this.options.minColumnWidth){
				column.setStyle('width', idealWidth + 'px');
			} else {
				column.setStyle('width', this.options.minColumnWidth + 'px');
				this.$repositionLeftColumns(colIndex - 1);
			}
		} else if (colIndex != 0) {
			this.$repositionLeftColumns(colIndex - 1);
		}
	},
	$stretchToMatch: function(leftColumn, rightColumn){
		var leftColWidth = leftColumn.getComputedSize().width;
		var leftColRightEdge = Number.from(leftColumn.getStyle('right'));
		var rightColRightEdge = Number.from(rightColumn.getStyle('right'));
		var rightColLeftEdge = rightColRightEdge + rightColumn.getComputedSize().totalWidth;
		var newLeftColWidth = leftColWidth + leftColRightEdge - rightColLeftEdge;
		leftColumn.setStyles({
			right: rightColLeftEdge + 'px',
			width: newLeftColWidth + 'px'
		});
	},
	$equalizeFinalColumns: function(){
		var lastCols = this.columns.slice(this.columns.length - 2);
		var totalWidth = lastCols.map(function(col){ return col.getComputedSize().width }).sum();
		var equalizedWidth = Math.ceil(totalWidth / 2);
		lastCols[1].setStyle('width', equalizedWidth + 'px');
		lastCols[0].setStyles({
			width: totalWidth - equalizedWidth + 'px',
			right: lastCols[1].getComputedSize().totalWidth + 'px'
		});
	},
	$containerWidth: function(){
		return this.container.getComputedSize().totalWidth;
	}
});
