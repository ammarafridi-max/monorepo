export function createEmailSupportController({ service }) {
  const getEmails = async (req, res, next) => {
    try {
      const result = await service.getEmails(req.query);
      res.json({ status: 'success', data: result });
    } catch (err) {
      next(err);
    }
  };

  const updateDraft = async (req, res, next) => {
    try {
      const email = await service.updateDraft(req.params.id, req.body.draft);
      res.json({ status: 'success', data: email });
    } catch (err) {
      next(err);
    }
  };

  const sendReply = async (req, res, next) => {
    try {
      const email = await service.sendReply(req.params.id);
      res.json({ status: 'success', data: email });
    } catch (err) {
      next(err);
    }
  };

  const skipEmail = async (req, res, next) => {
    try {
      const email = await service.skipEmail(req.params.id);
      res.json({ status: 'success', data: email });
    } catch (err) {
      next(err);
    }
  };

  return { getEmails, updateDraft, sendReply, skipEmail };
}
