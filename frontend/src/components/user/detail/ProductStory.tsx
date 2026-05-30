import React from 'react';

interface ProductStoryProps {
  watch: any;
}

/**
 * Large editorial "story" section — description, craftsmanship and materials
 * presented Rolex-style with generous typography and a supporting image.
 */
export default function ProductStory({ watch }: ProductStoryProps) {
  const supportImage = watch.gallery?.[1] || watch.gallery?.[0] || watch.image;
  const caseMaterial = watch.specs?.['Chất liệu vỏ'];
  const movement = watch.specs?.['Bộ máy'];
  const glass = watch.specs?.['Chất liệu kính'];

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#e9e3d8] bg-white shadow-luxe-sm">
      <div className="grid items-stretch lg:grid-cols-2">
        {/* Editorial copy */}
        <div className="flex flex-col justify-center p-8 md:p-12">
          <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-champagne">
            Câu chuyện sản phẩm
          </span>
          <h3 className="mt-3 font-display text-2xl font-bold leading-tight text-navy md:text-3xl">
            Di sản chế tác trên từng cổ tay
          </h3>

          <p className="mt-5 text-[15px] leading-[1.9] text-gray-600 first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-5xl first-letter:font-bold first-letter:leading-[0.8] first-letter:text-navy">
            {watch.description}
          </p>

          <p className="mt-4 text-[15px] leading-[1.9] text-gray-600">
            Mỗi tác phẩm được lắp ráp tỉ mỉ bởi các nghệ nhân chế tác dày dặn kinh nghiệm — thừa hưởng
            tinh hoa cơ khí hàng trăm năm hoà cùng phong cách đương đại lịch lãm. Đây không đơn thuần là
            cỗ máy đo thời gian, mà là một tuyên ngôn phong cách cho chủ nhân sở hữu.
          </p>

          {/* Craftsmanship highlights pulled from real specs */}
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {caseMaterial && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Chất liệu</p>
                <p className="mt-1 font-display text-sm font-bold text-navy">{caseMaterial}</p>
              </div>
            )}
            {movement && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Bộ máy</p>
                <p className="mt-1 font-display text-sm font-bold text-navy">{movement}</p>
              </div>
            )}
            {glass && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Mặt kính</p>
                <p className="mt-1 font-display text-sm font-bold text-navy">{glass}</p>
              </div>
            )}
          </div>
        </div>

        {/* Supporting image */}
        <div className="relative min-h-[280px] overflow-hidden lg:min-h-full">
          <img
            src={supportImage}
            alt={watch.name}
            className="h-full w-full object-cover transition duration-700 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/40 via-transparent to-transparent" />
        </div>
      </div>
    </div>
  );
}
