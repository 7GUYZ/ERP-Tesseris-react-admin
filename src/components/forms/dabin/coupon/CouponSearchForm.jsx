"use client"

import { useState } from "react"
import { Grid, TextField, Select, MenuItem, FormControl, Typography, Paper, Box } from "@mui/material"
import '../../../../styles/dabin/CouponSearchForm.css';

const CouponSearchForm = ({ onSearch, issuanceStatus, providedStatus, onParamsChange }) => {
  const [form, setForm] = useState({
    issuanceStart: "",
    issuanceEnd: "",
    providedStart: "",
    providedEnd: "",
    limitStart: "",
    limitEnd: "",
    issuanceUserId: "",
    providedUserId: "",
    issuanceStatusIndex: "",
    providedStatusIndex: "",
    couponName: "",
    couponPrice: "",
  })

  const handleChange = (e) => {
    const newForm = { ...form, [e.target.name]: e.target.value }
    setForm(newForm)
    if (onParamsChange) {
      onParamsChange(newForm)
    }
  }



  // handleSubmit과 Button 제거

  return (
    <Paper
      elevation={0}
      className="coupon-searchform-paper"
    >
      {/* form 태그와 onSubmit 제거 */}
      <Grid container direction="column" spacing={1}>
          {/* 1줄: 발행/지급 날짜 */}
          <Grid item>
            <div className="coupon-searchform-row">
              <Grid item sx={{ flex: 1, minWidth: 0 }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item><Typography variant="body2" className="coupon-searchform-label">발행 시작일</Typography></Grid>
                  <Grid item sx={{ flex: 1 }}>
                    <TextField
                      type="date"
                      name="issuanceStart"
                      value={form.issuanceStart}
                      onChange={handleChange}
                      size="small"
                      margin="dense"
                      InputProps={{ className: "coupon-searchform-input" }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item sx={{ flex: 1, minWidth: 0 }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item><Typography variant="body2" className="coupon-searchform-label">발행 종료일</Typography></Grid>
                  <Grid item sx={{ flex: 1 }}>
                    <TextField
                      type="date"
                      name="issuanceEnd"
                      value={form.issuanceEnd}
                      onChange={handleChange}
                      size="small"
                      margin="dense"
                      InputProps={{ className: "coupon-searchform-input" }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item sx={{ flex: 1, minWidth: 0 }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item><Typography variant="body2" className="coupon-searchform-label">지급 시작일</Typography></Grid>
                  <Grid item sx={{ flex: 1 }}>
                    <TextField
                      type="date"
                      name="providedStart"
                      value={form.providedStart}
                      onChange={handleChange}
                      size="small"
                      margin="dense"
                      InputProps={{ className: "coupon-searchform-input" }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item sx={{ flex: 1, minWidth: 0 }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item><Typography variant="body2" className="coupon-searchform-label">지급 종료일</Typography></Grid>
                  <Grid item sx={{ flex: 1 }}>
                    <TextField
                      type="date"
                      name="providedEnd"
                      value={form.providedEnd}
                      onChange={handleChange}
                      size="small"
                      margin="dense"
                      InputProps={{ className: "coupon-searchform-input" }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Grid>
            </div>
          </Grid>

          {/* 2줄: 만기 날짜, 발행상태, 지급상태 */}
          <Grid item>
            <Grid container spacing={1} alignItems="center" wrap="nowrap">
              <Grid item sx={{ flex: 1, minWidth: 0 }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item><Typography variant="body2" className="coupon-searchform-label">만기 시작일</Typography></Grid>
                  <Grid item sx={{ flex: 1 }}>
                    <TextField
                      type="date"
                      name="limitStart"
                      value={form.limitStart}
                      onChange={handleChange}
                      size="small"
                      margin="dense"
                      InputProps={{ className: "coupon-searchform-input" }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item sx={{ flex: 1, minWidth: 0 }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item><Typography variant="body2" className="coupon-searchform-label">만기 종료일</Typography></Grid>
                  <Grid item sx={{ flex: 1 }}>
                    <TextField
                      type="date"
                      name="limitEnd"
                      value={form.limitEnd}
                      onChange={handleChange}
                      size="small"
                      margin="dense"
                      InputProps={{ className: "coupon-searchform-input" }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item sx={{ flex: 1, minWidth: 0 }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item><Typography variant="body2" className="coupon-searchform-label">발행상태</Typography></Grid>
                  <Grid item sx={{ flex: 1 }}>
                    <FormControl size="small" fullWidth sx={{ height: 32 }}>
                      <Select
                        name="issuanceStatusIndex"
                        value={form.issuanceStatusIndex}
                        onChange={handleChange}
                        style={{ minWidth: 100 }}
                        displayEmpty
                        fullWidth
                        size="small"
                        margin="dense"
                        sx={{ height: 32, padding: '0 8px' }}
                      >
                        <MenuItem value="">전체</MenuItem>
                        {issuanceStatus.map(s => (
                          <MenuItem key={s.couponIssuanceStatusIndex} value={s.couponIssuanceStatusIndex}>{s.couponIssuanceStatus}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item sx={{ flex: 1, minWidth: 0 }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item><Typography variant="body2" className="coupon-searchform-label">지급상태</Typography></Grid>
                  <Grid item sx={{ flex: 1 }}>
                    <FormControl size="small" fullWidth sx={{ height: 32 }}>
                      <Select
                        name="providedStatusIndex"
                        value={form.providedStatusIndex}
                        onChange={handleChange}
                        style={{ minWidth: 100 }}
                        displayEmpty
                        fullWidth
                        size="small"
                        margin="dense"
                        sx={{ height: 32, padding: '0 8px' }}
                      >
                        <MenuItem value="">전체</MenuItem>
                        {providedStatus.map(s => (
                          <MenuItem key={s.couponProvidedStatusIndex} value={s.couponProvidedStatusIndex}>{s.couponProvidedStatus}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* 3줄: 발행자, 지급자, 쿠폰명, 쿠폰가격 */}
          <Grid item>
            <Grid container spacing={1} alignItems="center" wrap="nowrap">
              <Grid item sx={{ flex: 1, minWidth: 0 }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item><Typography variant="body2" className="coupon-searchform-label">발행자ID</Typography></Grid>
                  <Grid item sx={{ flex: 1 }}>
                    <TextField
                      name="issuanceUserId"
                      value={form.issuanceUserId}
                      onChange={handleChange}
                      size="small"
                      margin="dense"
                      placeholder="발행자ID"
                      InputProps={{ className: "coupon-searchform-input" }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item sx={{ flex: 1, minWidth: 0 }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item><Typography variant="body2" className="coupon-searchform-label">지급자ID</Typography></Grid>
                  <Grid item sx={{ flex: 1 }}>
                    <TextField
                      name="providedUserId"
                      value={form.providedUserId}
                      onChange={handleChange}
                      size="small"
                      margin="dense"
                      placeholder="지급자ID"
                      InputProps={{ className: "coupon-searchform-input" }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item sx={{ flex: 1, minWidth: 0 }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item><Typography variant="body2" className="coupon-searchform-label">쿠폰명</Typography></Grid>
                  <Grid item sx={{ flex: 1 }}>
                    <TextField
                      name="couponName"
                      value={form.couponName}
                      onChange={handleChange}
                      size="small"
                      margin="dense"
                      placeholder="쿠폰명"
                      InputProps={{ className: "coupon-searchform-input" }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item sx={{ flex: 1, minWidth: 0 }}>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item><Typography variant="body2" className="coupon-searchform-label">쿠폰가격</Typography></Grid>
                  <Grid item sx={{ flex: 1 }}>
                    <TextField
                      name="couponPrice"
                      type="number"
                      value={form.couponPrice}
                      onChange={handleChange}
                      size="small"
                      margin="dense"
                      placeholder="쿠폰가격"
                      InputProps={{ className: "coupon-searchform-input" }}
                      fullWidth
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          {/* 4줄: 조회 버튼만 한 줄 전체 차지 */}
          {/* <Grid item>
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ height: 40 }}>
              조회
            </Button>
          </Grid> */}
        </Grid>
    </Paper>
  )
}

export default CouponSearchForm
