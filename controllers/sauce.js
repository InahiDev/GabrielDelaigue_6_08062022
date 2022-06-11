const Sauce = require('../models/Sauce')
const fs= require('fs')
/*const auth = require('../middleware/auth')
const jwt = require('jsonwebtoken')*/

exports.getAllSauces = (req, res, next) => {
  Sauce.find()
    .then(sauces => res.status(200).json(sauces))
    .catch(error => res.status(400).json({ error }))
}

exports.getOneSauce = (req,res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({ error }))
}

exports.createSauce = (req, res, next) => {
  const sauceObject = JSON.parse(req.body.sauce)
  const sauce = new Sauce({
    ...sauceObject,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: []
  })
  sauce.save()
    .then(() => res.status(201).json({ message: 'Sauce enregistrée!'}))
    .catch(error => res.status(400).json({ error }))
}

exports.updateSauce = (req, res, next) => {
  if (req.file) {
    const sauceObject = {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    }
    Sauce.findOne({ _id: req.params.id })
      .then(sauce => {
        const filename = sauce.imageUrl.split('/images/')[1]
        fs.unlink(`images/${filename}`, () => {
          Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
            .then(() => res.status(200).json({ message: "Sauce modifiée et ancienne image supprimée!" }))
            .catch(error => res.status(400).json({ error }))
        })
      })
      .catch(error => res.status(404).json({ error }))
  } else {
    const sauceObject = { ...req.body }
    Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
      .then(() => res.status(200).json({ message: "Sauce modifée!" }))
      .catch(error => res.status(400).json({ error }))
  }
  /*Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      const filename = sauce.imageUrl.split('/images/')[1]
      const sauceObject = req.file ?
      fs.unlink(`images/${filename}`, () => {
        {
          ...JSON.parse(req.body.sauce),
          imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } 
      }) : { ...req.body }
  })
    .catch(error => res.status(404).json({ error }))*/
  /*const sauceObject = req.file ?
    {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body }
  Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Sauce modifiée!' }))
    .catch(error => res.status(400).json({ error }))*/
}

exports.deleteSauce = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      const filename = sauce.imageUrl.split('/images/')[1]
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(204).json({ message: 'Sauce supprimée!' }))
          .catch(error => res.status(400).json({ error }))
      })
    })
    .catch(error => res.status(500).json({ error }))
}

exports.likeStatus = (req, res, next) => {
  const sauceId = req.params.id
  const userId = req.body.userId
  Sauce.findOne({ _id: sauceId })
    .then(sauce => {
      let likes = sauce.likes
      let dislikes = sauce.dislikes
      switch (req.body.like) {
        case 1:
          if (!sauce.usersLiked.includes(userId)) {
            sauce.usersLiked.push(userId)
            likes = likes + 1
          }
          if (sauce.usersDisliked.includes(userId)) {
              const userIndex = sauce.usersDisliked.indexOf(userId)
              sauce.usersDisliked.splice(userIndex, 1)
              dislikes = dislikes - 1
          }
          const sauceObjectLike = {
            likes: likes,
            dislikes: dislikes,
            usersLiked: sauce.usersLiked,
            usersDisliked: sauce.usersDisliked
          }
          Sauce.updateOne({ _id: sauceId }, { ...sauceObjectLike, _id: sauceId })
            .then(() => res.status(200).json({ message: "Like comptabilisé!" }))
            .catch(error => res.status(400).json({ error }))
          break
        case 0:
          if (sauce.usersLiked.includes(userId)) {
            const userIndex = sauce.usersLiked.indexOf(userId)
            sauce.usersLiked.splice(userIndex, 1)
            likes = likes - 1
          }
          if (sauce.usersDisliked.includes(userId)) {
            const userIndex = sauce.usersDisliked.indexOf(userId)
            sauce.usersDisliked.splice(userIndex, 1)
            dislikes = dislikes - 1
          }
          const sauceObject = {
            likes: likes,
            dislikes: dislikes,
            usersLiked: sauce.usersLiked,
            usersDisliked: sauce.usersDisliked
          }
          Sauce.updateOne({ _id: sauceId }, { ...sauceObject, _id: sauceId })
            .then(() => res.status(200).json({ message: "Like ou Dislike annulé!" }))
            .catch(error => res.status(400).json({ error }))
          break
        case -1:
          if (!sauce.usersDisliked.includes(userId)) {
            sauce.usersDisliked.push(userId)
            dislikes = dislikes + 1
          }
          if (sauce.usersLiked.includes(userId)) {
            const userIndex = sauce.usersLiked.indexOf(userId)
            sauce.usersLiked.splice(userIndex, 1)
            likes = likes + 1
          }
          const sauceObjectDislike = {
            likes: likes,
            dislikes: dislikes,
            usersLiked: sauce.usersLiked,
            usersDisliked: sauce.usersDisliked,
          }
          Sauce.updateOne({ _id: sauceId }, { ...sauceObjectDislike, _id: sauceId })
            .then(() => res.status(200).json({ message: "Dislike comptabilisé!" }))
            .catch(error => res.status(400).json({ error }))
          break
        default:
          res.status(500).json({ error })
      }
    })
    .catch(error => res.status(400).json({ error }))
}


/*exports.likeSauce = (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1]
  const decodedToken = jwt.verify(token, 'A_SUPER_SECRET_RANDOM_DECODING_KEY')
  const userId = decodedToken.userId
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      if (!sauce.usersLiked.find(userId)) {
        req.body = {
          userId: userId,
          like: 1
        }
        sauce.likes = sauce.likes ++
        sauce.usersLiked.push(userId)
        if (sauce.usersDisliked.find(userId)) {
          const userIndex = sauce.usersDisliked.indexOf(userId)
          sauce.usersDisliked.splice(userIndex, 1)
        }
        res.status(200).json({ message: 'Like comptabilisé!'})
      } else {
        req.body = {
          userId: userId,
          like: 0
        }
        sauce.likes = sauce.likes --
        const userIndex = sauce.usersLiked.indexOf(userId)
        sauce.usersLiked.splice(userIndex, 1)
        res.status(200).json({ message: 'Like enlevé' })
      }
    })
    .catch(error => res.status(400).json({ error }))
}

exports.dislikeSauce = (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1]
  const decodedToken = jwt.verify(token, 'A_SUPER_SECRET_RANDOM_DECODING_KEY')
  const userId = decodedToken.userId
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      if(!sauce.usersDisliked.find(userId)) {
        req.body = {
          userId: userId,
          like: -1
        }
        sauce.dislikes = sauce.dislikes ++
        sauce.usersDisliked.push(userId)
        if (sauce.usersLiked.find(userId)) {
          const userIndex = sauce.usersLiked.indexOf(userId)
          sauce.usersLiked.splice(userIndex, 1)
        }
        res.status(200).json({ message: 'Dislike comptabilisé!' })
      } else {
        sauce.dislikes = sauce.dislikes --
        const userIndex = sauce.usersDisliked.indexOf(userId)
        sauce.usersDisliked.splice(userIndex, 1)
        res.status(200).json({ message: 'Dislike enlevé!' })
      }
    })
    .catch(error => res.status(404).json({ error }))
}*/