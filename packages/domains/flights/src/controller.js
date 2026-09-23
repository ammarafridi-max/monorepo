import { catchAsync } from '@travel-suite/utils';

export function createFlightController({ service }) {
  const fetchFlightsList = catchAsync(async (req, res) => {
    const flights = await service.searchFlights(req.body);
    res.status(200).json({ status: 'success', data: flights });
  });

  const addAirlineInfoByCode = catchAsync(async (req, res) => {
    const airline = await service.addAirlineByCode(req.params.airlineCode);
    res.status(200).json({ status: 'success', data: airline });
  });

  const fetchAirlines = catchAsync(async (_req, res) => {
    const data = await service.listAirlines();
    res.status(200).json({ status: 'success', results: data.length, data });
  });

  const updateAirlineLogo = catchAsync(async (req, res) => {
    const airline = await service.setAirlineLogo({
      iataCode: req.params.airlineCode,
      buffer: req.file?.buffer,
      mimetype: req.file?.mimetype,
    });
    res.status(200).json({ status: 'success', data: airline });
  });

  const deleteAirlineLogo = catchAsync(async (req, res) => {
    const airline = await service.removeAirlineLogo(req.params.airlineCode);
    res.status(200).json({ status: 'success', data: airline });
  });

  const fetchAirports = catchAsync(async (req, res) => {
    const data = await service.fetchAirports(req.query.keyword);
    res.status(200).json({ status: 'success', data });
  });

  return {
    fetchFlightsList,
    addAirlineInfoByCode,
    fetchAirlines,
    updateAirlineLogo,
    deleteAirlineLogo,
    fetchAirports,
  };
}
