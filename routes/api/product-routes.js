const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

router.get('/', async (req, res) => {
  try {
    const productData = await Product.findAll({
      include: [{ model: Category, through: ProductTag, model: Tag, through: ProductTag }]
    });
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const productData = await Product.findByPk(req.params.id, {
      include: [{ model: Category, model: Tag, through: ProductTag }]
    });

    if (!productData) {
      res.status(404).json({ message: "No category data found with this id" });
      return;
    }
    res.status(200).json(productData);
  } catch (err) {
    res.status(500).json(err);
  }
});

router.post('/', async (req, res) => {
  try {
    const productData = await Product.create(req.body)
    if (req.body.tagIds.length) {
      const productTagIdArr = req.body.tagIds.map((tag_id) => {
        return {
          product_id: productData.id,
          tag_id,
        };
      });
      const productTags = await ProductTag.bulkCreate(productTagIdArr);
      res.status(200).json({ ...productData, productTags });
    } else {
      res.status(200).json(productData);
    }
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  };
});

router.put('/:id', async (req, res) => {
  try {
    const productData = await Product.update(req.body, {
      where: {
        id: req.params.id
      },
    });

    if (req.body.tagIds && req.body.tagIds.length) {
      const currentProductTags = await ProductTag.findAll({
        where: { product_id: req.params.id },
      });

      const currentProductTagIds = currentProductTags.map(tag => tag.tag_id);
      const newProductTagIds = req.body.tagIds;


      const tagsToAdd = newProductTagIds.filter(id => !currentProductTagIds.includes(id))
        .map(tag_id => ({ product_id: req.params.id, tag_id }));
      const tagsToRemove = currentProductTags.filter(({ tag_id }) => !newProductTagIds.includes(tag_id))
        .map(tag => tag.id);

      await Promise.all([
        tagsToRemove.length > 0 ? ProductTag.destroy({ where: { id: tagsToRemove } }) : null,
        tagsToAdd.length > 0 ? ProductTag.bulkCreate(tagsToAdd) : null,
      ]);

      const updatedProduct = await Product.findByPk(req.params.id, {
        include: [{
          model: Tag,
          through: ProductTag,
          as: 'tags'
        }]
      });

      res.json(updatedProduct);
    } else {

      const updatedProduct = await Product.findByPk(req.params.id);
      res.json(updatedProduct);
    }
  } catch (err) {
    console.error(err);
    res.status(400).json(err);
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.destroy({
      where: {
        id: req.params.id
      },
    });

    if (!deletedProduct) {
      res.status(404).json({ message: 'No product found with that id' });
      return;
    }
    res.status(200).json({ message: 'Product successfully removed' });
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;
