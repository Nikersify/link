var arr = ['start', 'loading', 'finish']

for (let c of arr) {
	Vue.component(c + '-view', {
		template: '#' + c + '-template'
	})
}

Vue.component('stats-view', {
	template: '#stats-template',
	data: function () {
		return {
			chart: null,
			tabs: [
				{
					name: 'Country',
					icon: 'globe'
				},
				{
					name: 'Referer',
					icon: 'external-link'
				},
				{
					name: 'Browser',
					icon: 'cloud'
				},
				{
					name: 'Platform',
					icon: 'laptop'
				}
			]
		}
	},
	methods: {
		tabSelect: function (e) {
			var type = e.target.dataset.type.toLowerCase()
			this.updateChart(type)
		},

		updateChart: function (type) {
			type = type || 'browser'

			var d = this.$parent.retrievedStats[type]

			this.chart.data.labels = Object.keys(d)
			this.chart.data.datasets = [{
				data: Object.values(d),
				borderWidth: 10
			}]

			this.chart.update()
		}
	},
	mounted: function () {
		const labels = []

		Chart.defaults.global.legend.display = false
		this.chart = new Chart('chart', {
			type: 'bar',
			options: {
				legend: {
					display: false
				},
				scales: {
					xAxes: [{ display: false }],
					yAxes: [{
						stacked: true
					}]
				}
			}
		})

		setTimeout(this.updateChart, 0)
	}
})

var initialData = {
	currentView: 'start-view',
	l: '',
	urlInputValue: ''
}

var vm = new Vue({
	el: '#app',
	template: '#app-template',
	computed: {
		linkOutputValue: function () {
			if (!this.l) return ''
			else return window.location.origin + '/' + this.l
		}
	},
	data: function () { return JSON.parse(JSON.stringify(initialData)) },
	methods: {
		copylinkOutput: function () {
			var ca = document.querySelector('.copy-area')
			ca.value = this.linkOutputValue
			ca.select()

			try {
				var s = document.execCommand('copy')
				console.log('copy', s)
				if (!s) throw 'copy command failed'
				this.flashCopySuccessBubble()
			} catch (e) {
				console.log(e)
			}
		},

		finish: function () {
			this.currentView = 'finish-view'
		},

		flashCopySuccessBubble: function () {
			var el = document.querySelector('.output-copy')
			if (!el) return

			el.classList.add('animation-flash-copied')

			setTimeout(function () {
				el.classList.remove('animation-flash-copied')
			}, 1500)
		},

		reset: function () {
			for (var index in initialData) {
				this[index] = initialData[index]
			}
		},

		stats: function () {
			if (typeof this.l === 'undefined' || this.l.length === 0) return

			var xhr = new XMLHttpRequest()
			xhr.open('GET', '/api/stats?l=' + this.l)
			var self = this
			xhr.addEventListener('load', function () {
				try {
					var body = JSON.parse(this.responseText)

					self.retrievedStats = body.res

					self.currentView = 'stats-view'
				} catch (e) {
					console.log('error while getting stats')
				}
			})

			xhr.send()
		},

		submit: function () {
			if (this.urlInputValue.length === 0) return
			this.currentView = 'loading-view'

			var xhr = new XMLHttpRequest()
			xhr.open('POST', '/api/new')
			xhr.setRequestHeader('Content-type',
				'application/x-www-form-urlencoded')

			xhr.send('url=' + this.urlInputValue)

			var self = this
			xhr.onreadystatechange = function () {
				if (xhr.readyState === XMLHttpRequest.DONE) {
					try {
						var body = JSON.parse(xhr.responseText)

						self.l = body.res.l
						if (!self.l) throw 'l not received'

						self.finish()
					} catch (e) {
						console.log(e)
					}
				}
			}
		}
	},
	watch: {
		urlInputValue: function (val, old) {
			if (val.length > old.length + 1)
				this.submit()
		}
	}
})
