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

  const fetchAirports = catchAsync(async (req, res) => {
    const data = await service.fetchAirports(req.query.keyword);
    res.status(200).json({ status: 'success', data });
  });

  return { fetchFlightsList, addAirlineInfoByCode, fetchAirports };
}
