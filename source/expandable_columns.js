var ExpandableColumns = new Class({
	Implements: [Options, Events],
	options: {
		//height: '300px',
		initialWidths: [], //[100, 150, etc...]
		columnClass: 'column',
		resizeHandleClass: 'resize',
		minColumnWidth: 20,
		height: null
	},
	initialize: function(container, options){
		this.container = $(container).setStyle('position', 'relative');
		this.isContainerFull = false;
		this.options.height = this.options.height || this.container.getSize().y + 'px';
		this.setOptions(options);
		this.columns = this.container.getChildren();
		this.initializedColumns = [];
		this.handles = [];
		this.columns.each(function(column, i){ this.$initColumn(column, i) }, this);
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
			this.handles.push(new Element('div', {'class': this.options.resizeHandleClass}).inject(column));
			this.$repositionLeftColumns(i)
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
			} else{
				column.setStyle('width', this.options.minColumnWidth + 'px');
				this.$repositionLeftColumns(colIndex - 1);
			}
		} else if (colIndex != 0) {
			this.$repositionLeftColumns(colIndex - 1);
		}
		
	},	
	$containerWidth: function(){
		return this.container.getComputedSize().totalWidth;
	}
});
