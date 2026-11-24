import express from 'express';
import * as promotionController from '../controllers/promotionController.js';

const promotionRoute = express.Router();

promotionRoute.get('/', promotionController.fetchAll);
promotionRoute.get('/:id', promotionController.fetchOne);
promotionRoute.post('/', promotionController.create);
promotionRoute.put('/:id', promotionController.update);
promotionRoute.patch('/:id/enabled', promotionController.toggleEnabled);
promotionRoute.delete('/:id', promotionController.remove);

export default promotionRoute;
