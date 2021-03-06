const Link = require('../../models/Link')

module.exports = (req, res) => {
	const url = req.query.url || req.body.url

	if (!url)
		return res.status(400).json({ err: 'url not specified' })

	let id, link
	Link.genId().then((d) => {
		id = d
		link = new Link(id)
		return link.create(url)
	}).then((r) => {
		res.json({
			err: null,
			success: true,
			res: {
				l: id
			}
		})
	}).catch((err) => {
		return res.status(500).json({ err: 'server errror' })
	})
}
